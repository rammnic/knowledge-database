"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";

interface Note {
  id: string;
  title: string;
  slug: string;
  maturity: string;
  updatedAt: string;
}

interface OptimizeNotesButtonProps {
  notes: Note[];
}

export function OptimizeNotesButton({ notes }: OptimizeNotesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const toggleNote = useCallback((noteId: string) => {
    setSelectedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedNotes(new Set(notes.map((n) => n.id)));
  }, [notes]);

  const deselectAll = useCallback(() => {
    setSelectedNotes(new Set());
  }, []);

  const handleOptimize = async () => {
    if (selectedNotes.size === 0) return;

    setIsOptimizing(true);
    setProgress({ current: 0, total: selectedNotes.size });
    setResult(null);

    try {
      const response = await fetch("/api/ai/optimize/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noteIds: Array.from(selectedNotes) }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: data.success || 0,
          errors: data.errors || 0,
        });
        
        // Clear selection after successful optimization
        setSelectedNotes(new Set());
        
        // Reload page after short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert(data.error || "Optimization failed");
      }
    } catch (error) {
      console.error("Failed to optimize notes:", error);
      alert("Failed to optimize notes");
    } finally {
      setIsOptimizing(false);
      setProgress(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isOptimizing}
        className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
          isOptimizing
            ? "bg-amber-500/20 text-amber-400 cursor-wait"
            : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
        }`}
      >
        {isOptimizing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Оптимизация...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>AI Оптимизация</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && !isOptimizing && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">
              Выбрано: {selectedNotes.size} / {notes.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-primary-light hover:underline"
              >
                Выбрать все
              </button>
              <button
                onClick={deselectAll}
                className="text-xs text-muted hover:underline"
              >
                Сбросить
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notes.map((note) => (
              <label
                key={note.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedNotes.has(note.id)}
                  onChange={() => toggleNote(note.id)}
                  className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
                />
                <span className="text-sm truncate flex-1">{note.title}</span>
                <span className="text-xs text-muted">{note.maturity}</span>
              </label>
            ))}
          </div>

          {/* Footer with optimize button */}
          <div className="p-3 border-t border-border">
            <button
              onClick={handleOptimize}
              disabled={selectedNotes.size === 0}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                selectedNotes.size > 0
                  ? "bg-primary/20 text-primary-light hover:bg-primary/30"
                  : "bg-surface text-muted cursor-not-allowed"
              }`}
            >
              Оптимизировать выбранные
            </button>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {progress && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-xl p-4 z-50">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span className="text-sm">Оптимизация...</span>
          </div>
          <div className="w-full bg-surface-hover rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2">
            {progress.current} / {progress.total}
          </p>
        </div>
      )}

      {/* Result indicator */}
      {result && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-xl p-4 z-50">
          <div className="flex items-center gap-2">
            {result.errors === 0 ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <X className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm">
              Успешно: {result.success}, Ошибок: {result.errors}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}