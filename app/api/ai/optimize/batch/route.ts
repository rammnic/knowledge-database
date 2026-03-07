// Helper для логирования с timestamp
const log = (tag: string, message: string) => {
  console.log(`[${new Date().toISOString()}] [${tag}] ${message}`);
};

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { processBacklinks } from "@/lib/backlinks";
import { initializeJSONWorkerPool, getJSONWorkerPool } from "@/lib/json-worker-pool";

// Глобальная переменная для пула воркеров
let jsonWorkerPool: ReturnType<typeof getJSONWorkerPool> | null = null;

// SSE streaming для отправки прогресса
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { noteIds } = await request.json();

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return new Response(JSON.stringify({ error: "No note IDs provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const results = {
          success: 0,
          errors: 0,
        };

        // Фаза 1: Предзагрузка всех данных (один раз)
        
        // Получаем существующие теги для подсказки AI
        const existingTags = await prisma.tag.findMany({
          select: { name: true, slug: true },
          orderBy: { name: 'asc' }
        });
        const existingTagsList = existingTags.map(t => t.slug).join(', ');

        // Предзагружаем все заметки для backlinks
        const allNotesForBacklinks = await prisma.note.findMany({
          select: { id: true, title: true, slug: true },
        });

        // Предзагружаем все существующие теги для оптимизации работы с ними
        const allExistingTags = await prisma.tag.findMany({
          select: { id: true, name: true, slug: true },
        });
        const tagsMap = new Map(allExistingTags.map(t => [t.slug, t]));

        // Предзагружаем все заметки для AI обработки
        const notesMap = new Map();
        const notes = await prisma.note.findMany({
          where: { id: { in: noteIds } },
          select: { id: true, title: true, content: true },
        });
        notes.forEach(note => notesMap.set(note.id, note));

        // Инициализируем пул воркеров для JSON парсинга (если ещё не инициализирован)
        // С fallback на синхронный парсинг, если worker pool не работает
        if (!jsonWorkerPool) {
          try {
            const poolSize = parseInt(process.env.JSON_WORKER_POOL_SIZE || "4", 10);
            jsonWorkerPool = await initializeJSONWorkerPool(poolSize);
            log("PHASE 1", `JSON Worker Pool initialized with ${poolSize} workers`);
          } catch (workerError) {
            console.warn('[PHASE 1] Worker pool initialization failed, using sync parsing:', workerError);
            jsonWorkerPool = null; // Will use sync fallback
          }
        }
        
        // Отправляем начальный статус
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "start", total: noteIds.length })}\n\n`)
        );
        
        log("PHASE 1", "Data preloading completed");

        // Фаза 2: AI оптимизация - полностью параллельно
        
        // Функция вызова AI для одной заметки (БЕЗ SSE - только параллельный AI)
        const callAI = async (noteId: string, index: number): Promise<{
          noteId: string;
          index: number;
          title: string;
          content: string;
          tags: string[];
          error?: string;
        }> => {
          const note = notesMap.get(noteId);
          
          if (!note) {
            // Отправляем событие об ошибке
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "ai-error",
                  index,
                  id: noteId,
                  title: "Unknown",
                  error: "Note not found"
                })}\n\n`
              )
            );
            return { noteId, index, title: '', content: '', tags: [], error: 'Note not found' };
          }

          // Отправляем событие о начале AI обработки
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "ai-start",
                index,
                id: noteId,
                title: note.title,
              })}\n\n`
            )
          );

          const aiStartTime = Date.now();
          log("OPTIMIZE", `START request for "${note.title}" (index: ${index})`);

          // Call OpenRouter API for optimization with timeout
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => {
            abortController.abort();
            log("OPTIMIZE", `Timeout for note ${noteId}`);
          }, 120000); // 2 min timeout

          // Get provider order from env or use default
          const providerOrder = (process.env.OPENROUTER_PROVIDER_ORDER || "sambanova,fireworks")
            .split(',')
            .map(p => p.trim())
            .filter(p => p);

          let response;
          try {
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://knowledge-database.com",
                "X-Title": "Knowledge Database",
              },
              body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp",
                provider: {
                  order: providerOrder,
                },
                messages: [
                  {
                    role: "system",
                    content: `You are a technical writer assistant. Your task is to PRESERVE and ENHANCE the content, not to summarize or shorten it.

RULES:
1. PRESERVE all original information - do not remove any details, explanations, or examples
2. PRESERVE all markdown formatting: code blocks, tables, diagrams, headings
3. PRESERVE all internal links like [[Note Title]]
4. ONLY improve: grammar, spelling, clarity of sentences
5. ONLY restructure if it improves readability (better headings, logical order)
6. DO NOT shorten or summarize - keep all content
7. Suggest 3-5 relevant tags based on content
8. IMPORTANT: Prefer using existing tags when possible. Existing tags in the system: ${existingTagsList || 'none'}. Use English, kebab-case format (e.g., "pci-dss", "banking-security"). Create new tags only if no existing tag fits.

IMPORTANT: Return in this exact format:
---CONTENT---
[full optimized content here - keep all diagrams, code blocks, tables, etc.]
---TAGS---
["tag1", "tag2", "tag3"]`
                  },
                  {
                    role: "user",
                    content: `Title: ${note.title}\n\nContent:\n${note.content}`
                  }
                ],
              }),
              signal: abortController.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }

          const responseTime = Date.now() - aiStartTime;
          log("OPTIMIZE", `RESPONSE received for "${note.title}" in ${responseTime}ms`);

          if (!response.ok) {
            // Отправляем событие об ошибке AI
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "ai-error",
                  index,
                  id: noteId,
                  title: note.title,
                  error: `OpenRouter API error: ${response.status}`
                })}\n\n`
              )
            );
            throw new Error(`OpenRouter API error: ${response.status}`);
          }

          const data = await response.json();
          const rawContent = data.choices[0].message.content;
          
          // Парсим ответ с разделителями (используем worker pool для JSON)
          // С fallback на синхронный парсинг при ошибке worker'а
          const parseStartTime = Date.now();
          let result: { content: string; tags: string[] };
          try {
            result = jsonWorkerPool 
              ? await parseOptimizeResponse(rawContent, jsonWorkerPool)
              : parseOptimizeResponseSync(rawContent);
          } catch (parseError) {
            console.warn(`[PARSE] Worker pool failed for "${note.title}", using sync fallback:`, parseError);
            result = parseOptimizeResponseSync(rawContent);
          }
          const parseTime = Date.now() - parseStartTime;
          log("OPTIMIZE", `PARSED for "${note.title}" in ${parseTime}ms`);

          // Отправляем событие о завершении AI обработки
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "ai-complete",
                index,
                id: noteId,
                title: note.title,
                duration: responseTime,
              })}\n\n`
            )
          );

          return {
            noteId,
            index,
            title: note.title,
            content: result.content || note.content,
            tags: result.tags || [],
          };
        };

        // Concurrency limiting - запускаем запросы пачками
        const concurrency = parseInt(process.env.OPENROUTER_CONCURRENCY || "5", 10);
        log("PHASE 2", `Starting ${noteIds.length} AI requests with concurrency ${concurrency}`);

        const aiResults: Array<PromiseSettledResult<{
          noteId: string;
          index: number;
          title: string;
          content: string;
          tags: string[];
          error?: string;
        }>> = [];

        // Process in batches
        for (let i = 0; i < noteIds.length; i += concurrency) {
          const batch = noteIds.slice(i, i + concurrency);
          const batchPromises = batch.map((noteId: string, batchIndex: number) => 
            callAI(noteId, i + batchIndex)
          );
          
          const batchResults = await Promise.allSettled(batchPromises);
          aiResults.push(...batchResults);
          
          log("PHASE 2", `Batch ${Math.floor(i / concurrency) + 1} completed (${Math.min(i + concurrency, noteIds.length)}/${noteIds.length})`);
        }
        
        log("PHASE 2", "All AI requests completed");

        // Фаза 3: Последовательная запись в DB (без конкуренции)
        log("PHASE 3", "Starting DB writes");
        
        for (const result of aiResults) {
          if (result.status === 'rejected') {
            results.errors++;
            continue;
          }

          const { noteId, index, title, content, tags, error } = result.value;

          // Отправляем статус "сохранение" перед DB записью
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "saving",
                index,
                id: noteId,
                title,
              })}\n\n`
            )
          );

          if (error) {
            results.errors++;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  index,
                  id: noteId,
                  error,
                })}\n\n`
              )
            );
            continue;
          }

          try {
            const dbWriteStart = Date.now();

            // Use transaction for all DB operations
            await prisma.$transaction(async (tx) => {
              // Update note with optimized content and set optimizedAt
              await tx.note.update({
                where: { id: noteId },
                data: {
                  content,
                  optimizedAt: new Date(),
                  updatedAt: new Date(),
                },
              });

              // Process backlinks with preloaded notes
              await processBacklinks(noteId, content, allNotesForBacklinks, tx);

              // Handle tags - оптимизировано с предзагруженными тегами
              if (tags.length > 0) {
                const newTags: Array<{ id: string; name: string; slug: string }> = [];
                
                for (const tagName of tags) {
                  const tagSlug = tagName.toLowerCase().trim()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/[\s_-]+/g, "-");
                  
                  const existingTag = tagsMap.get(tagSlug);
                  if (existingTag) {
                    newTags.push(existingTag);
                  } else {
                    const created = await tx.tag.create({
                      data: { name: tagName, slug: tagSlug },
                      select: { id: true, name: true, slug: true },
                    });
                    newTags.push(created);
                    tagsMap.set(tagSlug, created);
                  }
                }
                
                await tx.noteTag.deleteMany({
                  where: { noteId },
                });
                
                if (newTags.length > 0) {
                  await tx.noteTag.createMany({
                    data: newTags.map(tag => ({ noteId, tagId: tag.id })),
                  });
                }
              } else {
                await tx.noteTag.deleteMany({
                  where: { noteId },
                });
              }
            }, { timeout: 30000 });

            const dbWriteTime = Date.now() - dbWriteStart;
            log("OPTIMIZE", `DB write for "${title}" completed in ${dbWriteTime}ms`);

            results.success++;
            
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "success",
                  index,
                  id: noteId,
                  title,
                  duration: dbWriteTime,
                })}\n\n`
              )
            );

          } catch (error) {
            log("ERROR", `Error saving note ${noteId}: ${error}`);
            results.errors++;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  index,
                  id: noteId,
                  error: error instanceof Error ? error.message : "Unknown error",
                })}\n\n`
              )
            );
          }
        }

        // Отправляем финальный результат с summary
        log("SUMMARY", `Completed: ${results.success} success, ${results.errors} errors`);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done", ...results })}\n\n`)
        );
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (error) {
    console.error("Batch optimization error:", error);
    return new Response(JSON.stringify({ error: "Batch optimization failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Парсит ответ AI с разделителями ---CONTENT--- и ---TAGS---
// Использует worker pool для асинхронного парсинга JSON тегов
async function parseOptimizeResponse(
  text: string, 
  pool: ReturnType<typeof getJSONWorkerPool>
): Promise<{ content: string; tags: string[] }> {
  // Вариант 1: Оба разделителя ---CONTENT--- и ---TAGS---
  const fullMatch = text.match(/---CONTENT---\n([\s\S]*?)\n---TAGS---/);
  if (fullMatch) {
    const tagsMatch = text.match(/---TAGS---\n(\[[\s\S]*?\])/);
    let tags: string[] = [];
    if (tagsMatch) {
      // Используем worker pool для парсинга JSON
      tags = await pool.parseJSON(tagsMatch[1]);
    }
    return {
      content: fullMatch[1].trim(),
      tags
    };
  }
  
  // Вариант 2: Только ---TAGS--- в конце (AI может пропустить ---CONTENT---)
  const tagsOnlyMatch = text.match(/([\s\S]*?)\n---TAGS---\n(\[[\s\S]*?\])/);
  if (tagsOnlyMatch) {
    // Используем worker pool для парсинга JSON
    const tags = await pool.parseJSON(tagsOnlyMatch[2]);
    return {
      content: tagsOnlyMatch[1].trim(),
      tags
    };
  }
  
  // Fallback: если формат не найден, возвращаем весь текст как контент
  return {
    content: text.trim(),
    tags: []
  };
}

// Синхронный fallback парсер (если worker pool недоступен)
function parseOptimizeResponseSync(text: string): { content: string; tags: string[] } {
  // Вариант 1: Оба разделителя ---CONTENT--- и ---TAGS---
  const fullMatch = text.match(/---CONTENT---\n([\s\S]*?)\n---TAGS---/);
  if (fullMatch) {
    const tagsMatch = text.match(/---TAGS---\n(\[[\s\S]*?\])/);
    return {
      content: fullMatch[1].trim(),
      tags: tagsMatch ? JSON.parse(tagsMatch[1]) : []
    };
  }
  
  // Вариант 2: Только ---TAGS--- в конце
  const tagsOnlyMatch = text.match(/([\s\S]*?)\n---TAGS---\n(\[[\s\S]*?\])/);
  if (tagsOnlyMatch) {
    return {
      content: tagsOnlyMatch[1].trim(),
      tags: JSON.parse(tagsOnlyMatch[2])
    };
  }
  
  // Fallback
  return {
    content: text.trim(),
    tags: []
  };
}
