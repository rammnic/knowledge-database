import prisma from "@/lib/prisma";
import { getMaturityEmoji, getMaturityColor } from "@/lib/utils";
import Link from "next/link";

export default async function NotesPage() {
  const notes: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    maturity: string;
    updatedAt: Date;
  }> = await prisma.note.findMany({
    where: { status: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      maturity: true,
      updatedAt: true,
    },
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-glass-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-gradient">
            ← Knowledge Database
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Все заметки</h1>
          <p className="text-muted">
            {notes.length} публичных заметок в базе знаний
          </p>
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted mb-4">Пока нет публичных заметок</p>
            <Link
              href="/admin/editor"
              className="inline-block px-4 py-2 rounded-xl bg-primary/20 text-primary-light hover:bg-primary/30 transition-colors"
            >
              Создать первую заметку
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.slug}`}
                className="glass rounded-2xl p-6 hover:glass-hover transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{getMaturityEmoji(note.maturity)}</span>
                  <span className={`text-xs ${getMaturityColor(note.maturity)}`}>
                    {note.maturity}
                  </span>
                </div>
                <h2 className="text-lg font-semibold mb-2 group-hover:text-primary-light transition-colors">
                  {note.title}
                </h2>
                {note.excerpt && (
                  <p className="text-sm text-muted line-clamp-3 mb-4">
                    {note.excerpt}
                  </p>
                )}
                <div className="text-xs text-muted">
                  {new Date(note.updatedAt).toLocaleDateString("ru-RU")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}