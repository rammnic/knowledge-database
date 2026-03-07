import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/article/MarkdownRenderer";
import { TableOfContents } from "@/components/article/TableOfContents";
import { ContextPanel } from "@/components/article/ContextPanel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Получаем все заметки для создания мапы title -> slug (для wikilinks)
// Поддерживает как title на русском, так и slug на английском
async function getAllNotesMap(): Promise<Record<string, string>> {
  const notes = await prisma.note.findMany({
    where: { status: "PUBLIC" },
    select: { title: true, slug: true },
  });
  
  const map: Record<string, string> = {};
  for (const note of notes) {
    // Добавляем по title (на любом языке)
    map[note.title.toLowerCase()] = note.slug;
    // Добавляем по slug без дефисов (чтобы [[Linux Command Line Basics]] -> linux-command-line-basics)
    map[note.slug.toLowerCase().replace(/-/g, ' ')] = note.slug;
    // Добавляем сам slug
    map[note.slug.toLowerCase()] = note.slug;
  }
  return map;
}

export default async function NotePage({ params }: PageProps) {
  const { slug } = await params;

  // Предзагружаем мапу всех заметок для wikilinks
  const noteTitles = await getAllNotesMap();

  const note = await prisma.note.findUnique({
    where: { slug, status: "PUBLIC" },
    include: {
      author: {
        select: { name: true },
      },
      tags: {
        include: { tag: true },
      },
      backlinks: {
        include: {
          sourceNote: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
      forwardLinks: {
        include: {
          targetNote: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
    },
  });

  if (!note) {
    notFound();
  }

  // Extract headings for ToC
  const headings = extractHeadings(note.content);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-glass-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
<Link href="/" className="text-lg font-semibold text-gradient">
            ← Knowledge Database
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">
              {note.author.name || "Автор"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Table of Contents */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-8">
              <TableOfContents headings={headings} />
            </div>
          </aside>

          {/* Center Column - Content */}
          <main className="lg:col-span-7">
            <article className="glass rounded-2xl p-8">
              <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {note.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span className="capitalize">{note.maturity.toLowerCase()}</span>
                  <span>•</span>
                  <span>{new Date(note.updatedAt).toLocaleDateString("ru-RU")}</span>
                </div>
              </header>

              <MarkdownRenderer content={note.content} noteTitles={noteTitles} />
            </article>
          </main>

          {/* Right Column - Context Panel */}
          <aside className="lg:col-span-3">
            <div className="sticky top-8">
              <ContextPanel
                note={{
                  ...note,
                  createdAt: note.createdAt.toISOString(),
                  updatedAt: note.updatedAt.toISOString(),
                }}
                backlinks={note.backlinks}
                forwardLinks={note.forwardLinks}
                tags={note.tags}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function extractHeadings(content: string): Array<{ id: string; text: string; level: number }> {
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const lines = content.split("\n");
  const idCounts: Record<string, number> = {};

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      let id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      // Handle empty or dash-only IDs
      if (!id || id === "-") {
        id = "heading";
      }

      // Ensure unique IDs by adding suffix for duplicates
      if (idCounts[id] !== undefined) {
        idCounts[id]++;
        id = `${id}-${idCounts[id]}`;
      } else {
        idCounts[id] = 0;
      }

      headings.push({ id, text, level });
    }
  }

  return headings;
}
