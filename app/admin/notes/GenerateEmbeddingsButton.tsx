"use client";

import { useState } from "react";

interface GenerateEmbeddingsButtonProps {
  total: number;
  withEmbeddings: number;
}

export function GenerateEmbeddingsButton({ total, withEmbeddings }: GenerateEmbeddingsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/embeddings/batch", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({ 
          success: data.success || 0, 
          errors: data.errors || 0 
        });
        
        // Reload page after short delay to show updated stats
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert(data.error || "Failed to generate embeddings");
      }
    } catch (error) {
      console.error("Failed to generate embeddings:", error);
      alert("Failed to generate embeddings");
    } finally {
      setLoading(false);
    }
  };

  const withoutEmbeddings = total - withEmbeddings;
  const hasAllEmbeddings = withoutEmbeddings === 0;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading || hasAllEmbeddings}
        className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
          hasAllEmbeddings
            ? "bg-green-500/20 text-green-400 cursor-default"
            : loading
            ? "bg-purple-500/20 text-purple-400 cursor-wait"
            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span>Генерация...</span>
          </>
        ) : hasAllEmbeddings ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Все embeddings готовы</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Сгенерировать embeddings ({withoutEmbeddings})</span>
          </>
        )}
      </button>

      {result && (
        <span className="text-sm text-green-400">
          ✓ {result.success} успешно, {result.errors} ошибок
        </span>
      )}
    </div>
  );
}