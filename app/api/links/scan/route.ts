import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processBacklinks } from "@/lib/backlinks";

/**
 * API endpoint для пересканирования всех заметок и обновления backlinks
 * Использует существующую функцию processBacklinks из lib/backlinks.ts
 */

// POST - Scan all notes and update backlinks
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteIds = searchParams.get("ids")?.split(",").filter(Boolean);

    // Получаем все заметки для backlinks (чтобы не делать запрос на каждой итерации)
    const allNotes = await prisma.note.findMany({
      select: { id: true, title: true, slug: true },
    });

    // Определяем какие заметки сканировать
    let notesToScan;
    if (noteIds && noteIds.length > 0) {
      notesToScan = await prisma.note.findMany({
        where: { id: { in: noteIds } },
        select: { id: true, title: true, slug: true, content: true },
      });
    } else {
      notesToScan = await prisma.note.findMany({
        select: { id: true, title: true, slug: true, content: true },
      });
    }

    console.log(`[LINKS_SCAN] Found ${notesToScan.length} notes to scan`);

    let successCount = 0;
    let errorCount = 0;
    const results: Array<{ noteId: string; title: string; linksFound: number; error?: string }> = [];

    // Обрабатываем каждую заметку
    for (const note of notesToScan) {
      try {
        // Используем предзагруженные allNotes для matching
        await processBacklinks(note.id, note.content, allNotes);
        
        // Подсчитываем сколько линков нашли (и по title, и по slug)
        const linkPattern = /\[\[([^\]]+)\]\]/g;
        const matches = [...note.content.matchAll(linkPattern)];
        const linksFound = matches.filter(m => {
          const linkedTitle = m[1];
          const linkedSlug = linkedTitle.toLowerCase().replace(/\s+/g, '-');
          return allNotes.some(n => 
            n.title.toLowerCase() === linkedTitle.toLowerCase() || 
            n.slug.toLowerCase() === linkedSlug
          );
        }).length;

        results.push({
          noteId: note.id,
          title: note.title,
          linksFound,
        });
        successCount++;

        console.log(`[LINKS_SCAN] ✓ ${note.title}: ${linksFound} links`);
      } catch (error) {
        console.error(`[LINKS_SCAN] ✗ Error processing ${note.title}:`, error);
        results.push({
          noteId: note.id,
          title: note.title,
          linksFound: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        errorCount++;
      }
    }

    // Получаем статистику после сканирования
    const totalBacklinks = await prisma.backlink.count();

    return NextResponse.json({
      message: `Scanned ${notesToScan.length} notes`,
      success: successCount,
      errors: errorCount,
      totalBacklinks,
      results: results.slice(0, 100), // Ограничиваем ответ
    });
  } catch (error) {
    console.error("[LINKS_SCAN] Error:", error);
    return NextResponse.json(
      { error: "Failed to scan links" },
      { status: 500 }
    );
  }
}

// GET - Get backlinks statistics
export async function GET() {
  try {
    const totalNotes = await prisma.note.count();
    const totalBacklinks = await prisma.backlink.count();
    
    // Получаем заметки с наибольшим количеством backlinks
    const notesWithMostBacklinks = await prisma.note.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            backlinks: true,
            forwardLinks: true,
          },
        },
      },
      orderBy: {
        backlinks: {
          _count: "desc",
        },
      },
      take: 10,
    });

    return NextResponse.json({
      totalNotes,
      totalBacklinks,
      notesWithMostBacklinks: notesWithMostBacklinks.map(n => ({
        id: n.id,
        title: n.title,
        backlinksCount: n._count.backlinks,
        forwardLinksCount: n._count.forwardLinks,
      })),
    });
  } catch (error) {
    console.error("[LINKS_SCAN] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to get links stats" },
      { status: 500 }
    );
  }
}