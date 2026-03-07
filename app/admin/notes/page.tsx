import prisma from "@/lib/prisma";

// Отключаем статическую генерацию - страница должна рендериться на сервере
export const dynamic = 'force-dynamic';
import { getMaturityEmoji, getMaturityColor } from "@/lib/utils";
import Link from "next/link";
import { GenerateEmbeddingsButton } from "./GenerateEmbeddingsButton";
import { OptimizeNotesButton } from "./OptimizeNotesButton";
import { ScanLinksButton } from "./ScanLinksButton";

export default async function AdminNotesPage() {
  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { name: true } },
      tags: true,
      backlinks: true,
      forwardLinks: true,
    },
  });

  // Get embedding stats
  const totalNotes = notes.length;
  const notesWithEmbeddings = notes.filter((n) => n.embedding !== null).length;

  // Prepare notes for optimization button (pass minimal data)
  const notesForOptimization = notes.map(note => ({
    id: note.id,
    title: note.title,
    slug: note.slug,
    maturity: note.maturity,
    updatedAt: note.updatedAt.toISOString(),
    optimizedAt: note.optimizedAt?.toISOString() || null,
  }));

  // Prepare notes for scan links button
  const notesForScanLinks = notes.map(note => ({
    id: note.id,
    title: note.title,
    slug: note.slug,
  }));

  // Get backlinks stats
  const totalBacklinks = notes.reduce((sum, n) => sum + n.backlinks.length + n.forwardLinks.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Управление заметками</h1>
        <div className="flex items-center gap-3">
          <ScanLinksButton notes={notesForScanLinks} />
          <OptimizeNotesButton notes={notesForOptimization} />
          <GenerateEmbeddingsButton 
            total={totalNotes} 
            withEmbeddings={notesWithEmbeddings} 
          />
          <Link
            href="/admin/editor"
            className="px-4 py-2 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 transition-colors"
          >
            + Новая заметка
          </Link>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-muted mb-4">Пока нет заметок</p>
          <Link
            href="/admin/editor"
            className="inline-block px-4 py-2 rounded-xl bg-primary/20 text-primary-light hover:bg-primary/30 transition-colors"
          >
            Создать первую заметку
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="glass rounded-xl p-4 flex items-center justify-between hover:glass-hover transition-all"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <span className="text-2xl">{getMaturityEmoji(note.maturity)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{note.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${note.status === "PUBLIC" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {note.status === "PUBLIC" ? "Опубликовано" : "Черновик"}
                    </span>
                    <span className={`text-xs ${getMaturityColor(note.maturity)}`}>
                      {note.maturity}
                    </span>
                    {/* Backlinks status indicator */}
                    {(note.backlinks.length + note.forwardLinks.length) > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400" title={`Связей: ${note.backlinks.length} входящих, ${note.forwardLinks.length} исходящих`}>
                        🔗 {note.backlinks.length + note.forwardLinks.length}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-500" title="Нет связей">
                        🔗?
                      </span>
                    )}
                    {/* Embedding status indicator */}
                    {note.embedding ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400" title="Embedding готов">
                        AI
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-500" title="Embedding не сгенерирован">
                        AI?
                      </span>
                    )}
                    {/* Optimized status indicator */}
                    {note.optimizedAt ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400" title={`Оптимизировано: ${new Date(note.optimizedAt).toLocaleDateString("ru-RU")}`}>
                        ✓ Оптим.
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-500" title="Не оптимизировано">
                        Оптим.?
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted truncate">
                    {note.excerpt || "Без описания"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs text-muted">
                  {new Date(note.updatedAt).toLocaleDateString("ru-RU")}
                </span>
                <Link
                  href={`/admin/editor?id=${note.id}`}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary-light hover:bg-primary/20 transition-colors text-sm"
                >
                  Редактировать
                </Link>
                {note.status === "PUBLIC" && (
                  <Link
                    href={`/notes/${note.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-glass-border hover:border-primary/50 transition-colors text-sm"
                  >
                    Просмотр
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-muted">
        Всего заметок: {notes.length} | Опубликовано: {notes.filter(n => n.status === "PUBLIC").length} | Черновиков: {notes.filter(n => n.status === "DRAFT").length} | Связей: {totalBacklinks}
      </div>
    </div>
  );
}