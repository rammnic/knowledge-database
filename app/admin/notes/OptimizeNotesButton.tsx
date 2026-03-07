"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Loader2, Check, X, ChevronDown, ChevronUp, Zap } from "lucide-react";

interface Note {
  id: string;
  title: string;
  slug: string;
  maturity: string;
  updatedAt: string;
  optimizedAt?: string | null;
}

interface OptimizeNotesButtonProps {
  notes: Note[];
}

type ProgressEvent = 
  | { type: "start"; total: number }
  | { type: "ai-start"; index: number; id: string; title: string }
  | { type: "ai-complete"; index: number; id: string; title: string; duration: number }
  | { type: "ai-error"; index: number; id: string; title: string; error: string }
  | { type: "saving"; index: number; id: string; title: string }
  | { type: "success"; index: number; id: string; title: string; duration: number }
  | { type: "error"; index: number; id: string; error: string }
  | { type: "done"; success: number; errors: number };

export function OptimizeNotesButton({ notes }: OptimizeNotesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState<{ 
    current: number; 
    total: number; 
    currentTitle: string;
    phase: 'ai' | 'saving' | 'done';
    aiCompleted: number;
  } | null>(null);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const [skipOptimized, setSkipOptimized] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Фильтруем оптимизированные заметки если включена опция
  const availableNotes = skipOptimized 
    ? notes.filter(n => !n.optimizedAt)
    : notes;

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
    setSelectedNotes(new Set(availableNotes.map((n) => n.id)));
  }, [availableNotes]);

  const deselectAll = useCallback(() => {
    setSelectedNotes(new Set());
  }, []);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleOptimize = async () => {
    if (selectedNotes.size === 0) return;

    setIsOptimizing(true);
    setProgress({ current: 0, total: selectedNotes.size, currentTitle: "", phase: 'ai', aiCompleted: 0 });
    setResult(null);
    
    // Создаём AbortController для возможности отмены
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/optimize/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noteIds: Array.from(selectedNotes) }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Optimization failed");
        setIsOptimizing(false);
        setProgress(null);
        return;
      }

      // Читаем SSE поток
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Разбиваем на события
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: ProgressEvent = JSON.parse(line.slice(6));
              
              switch (event.type) {
                case "start":
                  setProgress({ current: 0, total: event.total, currentTitle: "Подготовка...", phase: 'ai', aiCompleted: 0 });
                  break;
                  
                case "ai-start":
                  setProgress((prev) => prev ? { 
                    ...prev, 
                    currentTitle: `AI: ${event.title}`,
                    phase: 'ai'
                  } : null);
                  break;
                  
                case "ai-complete":
                  setProgress((prev) => prev ? { 
                    ...prev, 
                    aiCompleted: prev.aiCompleted + 1,
                    currentTitle: `AI: ${event.title} (${event.duration}ms)`
                  } : null);
                  break;
                  
                case "ai-error":
                  setProgress((prev) => prev ? { 
                    ...prev, 
                    currentTitle: `Ошибка AI: ${event.title}`,
                    phase: 'ai'
                  } : null);
                  break;
                  
                case "saving":
                  setProgress({ 
                    current: event.index + 1, 
                    total: selectedNotes.size,
                    currentTitle: `Сохранение: ${event.title}`,
                    phase: 'saving',
                    aiCompleted: selectedNotes.size
                  });
                  break;
                  
                case "success":
                  // Progress already updated in saving
                  break;
                  
                case "error":
                  // Progress already updated in saving
                  break;
                  
                case "done":
                  setResult({
                    success: event.success,
                    errors: event.errors,
                  });
                  setIsOptimizing(false);
                  setProgress(null);
                  
                  // Reload page after short delay
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                  break;
              }
            } catch (e) {
              console.error("Failed to parse SSE event:", e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Optimization cancelled");
      } else {
        console.error("Failed to optimize notes:", error);
        alert("Failed to optimize notes");
      }
      setIsOptimizing(false);
      setProgress(null);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
              Выбрано: {selectedNotes.size} / {availableNotes.length}
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

          {/* Skip optimized checkbox */}
          <div className="px-3 py-2 border-b border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipOptimized}
                onChange={(e) => setSkipOptimized(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted">Пропустить оптимизированные</span>
              {skipOptimized && notes.length > availableNotes.length && (
                <span className="text-xs text-amber-400">
                  ({notes.length - availableNotes.length} уже оптимизировано)
                </span>
              )}
            </label>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {availableNotes.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">
                {skipOptimized ? "Все заметки уже оптимизированы" : "Нет доступных заметок"}
              </p>
            ) : (
              availableNotes.map((note) => (
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
              ))
            )}
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
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-border rounded-xl p-4 z-50">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span className="text-sm">
              {progress.phase === 'ai' ? 'AI обработка...' : 'Сохранение...'}
            </span>
            <button
              onClick={handleCancel}
              className="ml-auto text-xs text-red-400 hover:text-red-300"
            >
              Отмена
            </button>
          </div>
          
          {/* Phase indicator */}
          <div className="flex gap-1 mb-3">
            <div className={`flex-1 h-1 rounded ${progress.aiCompleted > 0 ? 'bg-green-500' : 'bg-surface-hover'}`} />
            <div className={`flex-1 h-1 rounded ${progress.phase === 'saving' ? 'bg-amber-500' : 'bg-surface-hover'}`} />
            <div className={`flex-1 h-1 rounded ${progress.phase === 'done' ? 'bg-green-500' : 'bg-surface-hover'}`} />
          </div>
          
          {/* AI progress bar */}
          {progress.phase === 'ai' && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>AI</span>
                <span>{progress.aiCompleted} / {progress.total}</span>
              </div>
              <div className="w-full bg-surface-hover rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(progress.aiCompleted / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* DB progress bar */}
          <div className="w-full bg-surface-hover rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progress.phase === 'saving' ? 'bg-amber-400' : 'bg-green-500'
              }`}
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2">
            {progress.phase === 'ai' 
              ? `AI обработано: ${progress.aiCompleted}/${progress.total}`
              : `Сохранено: ${progress.current}/${progress.total}`
            }
          </p>
          {progress.currentTitle && (
            <p className="text-xs text-primary-light mt-1 truncate" title={progress.currentTitle}>
              {progress.currentTitle}
            </p>
          )}
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