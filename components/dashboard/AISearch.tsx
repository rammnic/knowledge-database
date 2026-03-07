"use client";

import { useState, useCallback } from "react";
import { Search, Sparkles, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function AISearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isAI, setIsAI] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Array<{ slug: string; title: string; excerpt?: string }>>([]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setResults([]);

    try {
      const endpoint = isAI ? "/api/search/ai" : "/api/search";
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
      
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        
        // If single result and AI mode, navigate directly
        if (isAI && data.results?.length === 1) {
          router.push(`/notes/${data.results[0].slug}`);
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [query, isAI, router]);

  const clearResults = useCallback(() => {
    setResults([]);
    setQuery("");
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск по базе знаний..."
            className="w-full bg-surface border border-glass-border rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        
        {/* AI Toggle */}
        <button
          onClick={() => setIsAI(!isAI)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            isAI
              ? "bg-primary/20 text-primary-light border border-primary/30"
              : "surface border border-glass-border text-muted hover:text-white"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isAI ? "text-primary-light" : ""}`} />
          <span className="text-sm font-medium">AI</span>
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4 relative">
          {/* Clear button */}
          <button
            onClick={clearResults}
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-surface border border-border hover:bg-surface-hover transition-colors z-10"
            title="Скрыть результаты"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
          
          {/* Results list */}
          <div className="space-y-2">
            {results.map((result) => (
              <a
                key={result.slug}
                href={`/notes/${result.slug}`}
                className="block p-3 rounded-xl surface hover:surface-hover transition-colors"
              >
                <h4 className="font-medium text-white">{result.title}</h4>
                {result.excerpt && (
                  <p className="text-sm text-muted mt-1 line-clamp-2">{result.excerpt}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="mt-4 flex items-center gap-2 text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">
            {isAI ? "AI ищет..." : "Поиск..."}
          </span>
        </div>
      )}
    </div>
  );
}