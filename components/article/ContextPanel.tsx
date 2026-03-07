"use client";

import { getMaturityEmoji } from "@/lib/utils";

interface NoteTag {
  tag: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Backlink {
  id: string;
  sourceNote: {
    id: string;
    title: string;
    slug: string;
  };
}

interface ForwardLink {
  id: string;
  targetNote: {
    id: string;
    title: string;
    slug: string;
  };
}

interface Note {
  id: string;
  title: string;
  slug: string;
  maturity: string;
  createdAt: string;
  updatedAt: string;
}

interface ContextPanelProps {
  note: Note;
  backlinks: Backlink[];
  forwardLinks: ForwardLink[];
  tags: NoteTag[];
}

export function ContextPanel({ note, backlinks, forwardLinks, tags }: ContextPanelProps) {
  return (
    <div className="space-y-4">
      {/* Metadata Card */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">
          Метаданные
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Зрелость</span>
            <span className="flex items-center gap-1">
              {getMaturityEmoji(note.maturity)} {note.maturity}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Создано</span>
            <span>{new Date(note.createdAt).toLocaleDateString("ru-RU")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Обновлено</span>
            <span>{new Date(note.updatedAt).toLocaleDateString("ru-RU")}</span>
          </div>
        </div>
      </div>

      {/* Tags Card */}
      {tags.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h4 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">
            Теги
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <a
                key={t.tag.id}
                href={`/notes?tag=${t.tag.slug}`}
                className="px-2 py-1 rounded-md bg-surface text-xs text-secondary hover:text-white hover:bg-surface-hover transition-colors"
              >
                {t.tag.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Backlinks Card */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">
          Обратные ссылки ({backlinks.length})
        </h4>
        {backlinks.length === 0 ? (
          <p className="text-sm text-muted">Нет обратных ссылок</p>
        ) : (
          <ul className="space-y-2">
            {backlinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`/notes/${link.sourceNote.slug}`}
                  className="text-sm text-secondary hover:text-primary-light transition-colors line-clamp-1"
                >
                  {link.sourceNote.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Forward Links Card */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">
          Связанные заметки ({forwardLinks.length})
        </h4>
        {forwardLinks.length === 0 ? (
          <p className="text-sm text-muted">Нет связанных заметок</p>
        ) : (
          <ul className="space-y-2">
            {forwardLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`/notes/${link.targetNote.slug}`}
                  className="text-sm text-secondary hover:text-primary-light transition-colors line-clamp-1"
                >
                  {link.targetNote.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mini Graph Placeholder */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">
          Локальный граф
        </h4>
        <div className="h-24 rounded-lg bg-surface flex items-center justify-center">
          <p className="text-xs text-muted">Граф связей</p>
        </div>
      </div>
    </div>
  );
}