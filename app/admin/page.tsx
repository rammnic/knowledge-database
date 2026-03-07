import prisma from "@/lib/prisma";

// Отключаем статическую генерацию - страница должна рендериться на сервере
export const dynamic = 'force-dynamic';
import { getMaturityEmoji } from "@/lib/utils";
import Link from "next/link";

export default async function AdminPage() {
  const [notesCount, publicCount, draftCount] = await Promise.all([
    prisma.note.count(),
    prisma.note.count({ where: { status: "PUBLIC" } }),
    prisma.note.count({ where: { status: "DRAFT" } }),
  ]);

  const recentNotes: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    maturity: string;
    updatedAt: Date;
  }> = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      maturity: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Панель управления</h1>
        <p className="text-muted">Управление базой знаний</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="text-3xl font-bold text-white">{notesCount}</div>
          <div className="text-sm text-muted">Всего заметок</div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-3xl font-bold text-green-400">{publicCount}</div>
          <div className="text-sm text-muted">Опубликовано</div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-3xl font-bold text-yellow-400">{draftCount}</div>
          <div className="text-sm text-muted">Черновики</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/editor"
            className="px-4 py-2 rounded-xl bg-primary/20 text-primary-light hover:bg-primary/30 transition-colors"
          >
            + Новая заметка
          </Link>
          <Link
            href="/admin/notes"
            className="px-4 py-2 rounded-xl surface hover:surface-hover transition-colors"
          >
            Все заметки
          </Link>
        </div>
      </div>

      {/* Recent Notes */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Последние изменения</h2>
        {recentNotes.length === 0 ? (
          <p className="text-muted">Пока нет заметок</p>
        ) : (
          <div className="space-y-2">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between p-3 rounded-lg surface"
              >
                <div className="flex items-center gap-3">
                  <span>{getMaturityEmoji(note.maturity)}</span>
                  <div>
                    <Link
                      href={`/notes/${note.slug}`}
                      className="font-medium hover:text-primary-light transition-colors"
                    >
                      {note.title}
                    </Link>
                    <div className="text-xs text-muted">
                      {note.status === "PUBLIC" ? "Опубликовано" : "Черновик"} •{" "}
                      {new Date(note.updatedAt).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/editor?id=${note.id}`}
                  className="text-sm text-muted hover:text-white transition-colors"
                >
                  Редактировать →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}