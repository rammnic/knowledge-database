"use client";

import { useState, useEffect, useRef } from "react";
import { Link2, Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";

interface Note {
  id: string;
  title: string;
  slug: string;
}

interface ScanLinksButtonProps {
  notes: Note[];
}

export function ScanLinksButton({ notes }: ScanLinksButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentTitle: string } | null>(null);
  const [result, setResult] = useState<{ success: number; errors: number; totalBacklinks: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const toggleNote = (noteId: string) => {
    setSelectedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedNotes(new Set(notes.map((n) => n.id)));
  };

  const deselectAll = () => {
    setSelectedNotes(new Set());
  };

  const handleScan = async () => {
    if (selectedNotes.size === 0) return;

    setIsScanning(true);
    setProgress({ current: 0, total: selectedNotes.size, currentTitle: "Подготовка..." });
    setResult(null);

    abortControllerRef.current = new AbortController();

    try {
      const idsParam = Array.from(selectedNotes).join(",");
      const response = await fetch(`/api/links/scan?ids=${idsParam}`, {
        method: "POST",
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: data.success,
          errors: data.errors,
          totalBacklinks: data.totalBacklinks,
        });
        
        // Reload page after short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert(data.error || "Scan failed");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Scan cancelled");
      } else {
        console.error("Failed to scan links:", error);
        alert("Failed to scan links");
      }
    } finally {
      setIsScanning(false);
      setProgress(null);
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
        disabled={isScanning}
        className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
          isScanning
            ? "bg-blue-500/20 text-blue-400 cursor-wait"
            : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
        }`}
      >
        {isScanning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Сканирование...</span>
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            <span>Сканировать линки</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && !isScanning && (
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
            {notes.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">
                Нет доступных заметок
              </p>
            ) : (
              notes.map((note) => (
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
                </label>
              ))
            )}
          </div>

          {/* Footer with scan button */}
          <div className="p-3 border-t border-border">
            <button
              onClick={handleScan}
              disabled={selectedNotes.size === 0}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                selectedNotes.size > 0
                  ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  : "bg-surface text-muted cursor-not-allowed"
              }`}
            >
              Сканировать выбранные
            </button>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {progress && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-border rounded-xl p-4 z-50">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-sm">Сканирование линков...</span>
            <button
              onClick={handleCancel}
              className="ml-auto text-xs text-red-400 hover:text-red-300"
            >
              Отмена
            </button>
          </div>
          
          <div className="w-full bg-surface-hover rounded-full h-2 mb-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            Обработано: {progress.current} / {progress.total}
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
            <div>
              <p className="text-sm">
                Успешно: {result.success}, Ошибок: {result.errors}
              </p>
              <p className="text-xs text-muted">
                Всего связей: {result.totalBacklinks}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}