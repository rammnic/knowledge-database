"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Save, Eye, Sparkles, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/article/MarkdownRenderer";

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLIC">("DRAFT");
  const [maturity, setMaturity] = useState<"SEED" | "SAPLING" | "EVERGREEN">("SEED");
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [message, setMessage] = useState("");

  // Load existing note if editing
  useEffect(() => {
    if (noteId) {
      async function loadNote() {
        try {
          const res = await fetch(`/api/notes/${noteId}`);
          if (res.ok) {
            const note = await res.json();
            setTitle(note.title);
            setContent(note.content);
            setStatus(note.status);
            setMaturity(note.maturity);
          }
        } catch (error) {
          console.error("Failed to load note:", error);
        }
      }
      loadNote();
    }
  }, [noteId]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setMessage("Введите заголовок");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const method = noteId ? "PUT" : "POST";
      const endpoint = noteId ? `/api/notes/${noteId}` : "/api/notes";
      const secretToken = process.env.NEXT_PUBLIC_SECRET_TOKEN;
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (secretToken) {
        headers["Authorization"] = `Bearer ${secretToken}`;
      }
      
      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify({ title, content, status, maturity }),
      });

      if (res.ok) {
        const note = await res.json();
        setMessage("Сохранено!");
        if (!noteId) {
          router.push(`/admin/editor?id=${note.id}`);
        }
      } else {
        setMessage("Ошибка сохранения");
      }
    } catch (error) {
      setMessage("Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  }, [title, content, status, maturity, noteId, router]);

  const handleOptimize = useCallback(async () => {
    if (!content.trim()) {
      setMessage("Добавьте контент для оптимизации");
      return;
    }

    setIsOptimizing(true);
    setMessage("AI оптимизирует...");

    try {
      const res = await fetch("/api/ai/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noteId, title, content }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.optimizedContent) {
          setContent(data.optimizedContent);
        }
        if (data.suggestedTags) {
          setMessage(`Предложенные теги: ${data.suggestedTags.join(", ")}`);
        } else {
          setMessage("Контент оптимизирован!");
        }
      } else {
        setMessage("Ошибка оптимизации");
      }
    } catch (error) {
      setMessage("Ошибка оптимизации");
    } finally {
      setIsOptimizing(false);
    }
  }, [noteId, title, content]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {noteId ? "Редактирование" : "Новая заметка"}
        </h1>
        <div className="flex items-center gap-4">
          {message && (
            <span className="text-sm text-muted">{message}</span>
          )}
          
          {/* Status Select */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLIC")}
            className="bg-surface border border-glass-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLIC">Опубликовано</option>
          </select>

          {/* Maturity Select */}
          <select
            value={maturity}
            onChange={(e) => setMaturity(e.target.value as "SEED" | "SAPLING" | "EVERGREEN")}
            className="bg-surface border border-glass-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="SEED">🌱 Seed</option>
            <option value="SAPLING">🌿 Sapling</option>
            <option value="EVERGREEN">🌳 Evergreen</option>
          </select>

          {/* AI Optimize Button */}
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>AI Optimize</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Сохранить</span>
          </button>
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Заголовок заметки..."
        className="w-full bg-surface border border-glass-border rounded-xl px-4 py-3 text-xl font-semibold mb-4 focus:outline-none focus:border-primary"
      />

      {/* Split Screen Editor */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Editor Panel */}
        <div className="glass rounded-xl p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Markdown</span>
            <span className="text-xs text-muted">{content.length} символов</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Напишите вашу заметку в Markdown формате...

Используйте [[Название]] для создания ссылок на другие заметки."
            className="flex-1 w-full bg-transparent resize-none focus:outline-none font-mono text-sm"
          />
        </div>

        {/* Preview Panel */}
        <div className="glass rounded-xl p-4 overflow-auto">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-muted" />
            <span className="text-sm text-muted">Preview</span>
          </div>
          <div className="prose prose-invert max-w-none">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-muted">Превью будет здесь</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Загрузка...</p>
        </div>
      </div>
    }>
      <EditorPageContent />
    </Suspense>
  );
}
