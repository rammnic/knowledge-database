import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processBacklinks } from "@/lib/backlinks";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured" },
      { status: 503 }
    );
  }

  try {
    const { id, title, content } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    // Получаем существующие теги для подсказки AI
    const existingTags = await prisma.tag.findMany({
      select: { name: true, slug: true },
      orderBy: { name: 'asc' }
    });
    const existingTagsList = existingTags.map(t => t.slug).join(', ');

    // Use OpenRouter to optimize content with timeout
    const aiStartTime = Date.now();
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
      console.error(`[OPTIMIZE] Timeout for note ${id}`);
    }, 120000); // 2 min timeout

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
          model: process.env.OPENROUTER_MODEL,
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
              content: `Title: ${title}\n\nContent:\n${content}`
            }
          ],
        }),
        signal: abortController.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const aiTime = Date.now() - aiStartTime;
    console.log(`[OPTIMIZE] AI request completed in ${aiTime}ms`);

    if (!response.ok) {
      console.error("OpenRouter API error:", await response.text());
      return NextResponse.json(
        { error: "AI optimization failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    console.log("AI raw response:", rawContent.substring(0, 500));
    
    // Парсим ответ с разделителями
    const result = parseOptimizeResponse(rawContent);

    // Обновляем заметку с оптимизированным контентом
    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (note) {
      await prisma.note.update({
        where: { id: note.id },
        data: {
          content: result.content,
          optimizedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Process backlinks after content update
      await processBacklinks(note.id, result.content);
    }

    return NextResponse.json({
      optimizedContent: result.content,
      suggestedTags: result.tags,
    });
  } catch (error) {
    console.error("AI optimization error:", error);
    return NextResponse.json(
      { error: "AI optimization failed" },
      { status: 500 }
    );
  }
}

// Парсит ответ AI с разделителями ---CONTENT--- и ---TAGS---
function parseOptimizeResponse(text: string): { content: string; tags: string[] } {
  // Вариант 1: Оба разделителя ---CONTENT--- и ---TAGS---
  const fullMatch = text.match(/---CONTENT---\n([\s\S]*?)\n---TAGS---/);
  if (fullMatch) {
    const tagsMatch = text.match(/---TAGS---\n(\[[\s\S]*?\])/);
    return {
      content: fullMatch[1].trim(),
      tags: tagsMatch ? JSON.parse(tagsMatch[1]) : []
    };
  }
  
  // Вариант 2: Только ---TAGS--- в конце (AI может пропустить ---CONTENT---)
  const tagsOnlyMatch = text.match(/([\s\S]*?)\n---TAGS---\n(\[[\s\S]*?\])/);
  if (tagsOnlyMatch) {
    return {
      content: tagsOnlyMatch[1].trim(),
      tags: JSON.parse(tagsOnlyMatch[2])
    };
  }
  
  // Fallback: если формат не найден, возвращаем весь текст как контент
  return {
    content: text.trim(),
    tags: []
  };
}
