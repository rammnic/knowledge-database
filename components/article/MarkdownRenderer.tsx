"use client";

import { useState, useEffect } from "react";
import { marked, type Tokens } from "marked";
import { createHighlighter, type Highlighter } from "shiki";
import DOMPurify from "isomorphic-dompurify";

interface MarkdownRendererProps {
  content: string;
}

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Generate slug from text (matching extractHeadings in page.tsx)
function generateSlug(text: string, idCounts: Record<string, number>): string {
  let slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  // Handle empty or dash-only slugs
  if (!slug || slug === "-") {
    slug = "heading";
  }

  // Ensure unique IDs
  if (idCounts[slug] !== undefined) {
    idCounts[slug]++;
    slug = `${slug}-${idCounts[slug]}`;
  } else {
    idCounts[slug] = 0;
  }

  return slug;
}

// Custom renderer to add IDs to headings
const renderer = new marked.Renderer();

// idCounts должен быть на уровне замыкания, чтобы сохраняться между вызовами
let idCounts: Record<string, number> = {};

renderer.heading = function({ text, depth }: Tokens.Heading) {
  const id = generateSlug(text, idCounts);
  
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

marked.use({ renderer });

// Cache for highlighter
let highlighterPromise: Promise<Highlighter> | null = null;
let cachedHighlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (cachedHighlighter) {
    return cachedHighlighter;
  }
  
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: ["javascript", "typescript", "python", "bash", "json", "html", "css", "markdown", "sql", "yaml", "go", "rust", "java", "c", "cpp", "php", "ruby", "swift", "kotlin"],
    });
  }
  
  cachedHighlighter = await highlighterPromise;
  return cachedHighlighter;
}

// Parse markdown to HTML using marked
function parseMarkdownToHtml(markdown: string): string {
  // Reset ID counter before each parse to match server-side extractHeadings
  idCounts = {};
  return marked.parse(markdown) as string;
}

// Highlight code blocks in HTML using Shiki
async function highlightCodeBlocks(html: string): Promise<string> {
  const highlighter = await getHighlighter();
  
  // Find all <code class="language-xxx">...</code> blocks inside <pre>
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  
  let result = html;
  let match;
  
  // Collect all matches first
  const matches: Array<{ match: RegExpExecArray; start: number; end: number }> = [];
  
  while ((match = codeBlockRegex.exec(html)) !== null) {
    matches.push({
      match,
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  // Process in reverse to preserve positions
  for (const m of matches.reverse()) {
    const lang = m.match[1];
    const code = m.match[2];
    
    // Decode HTML entities that marked might have encoded
    const decodedCode = code
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/&/g, "&")
      .replace(/"/g, '"')
      .replace(/&#39;/g, "'");
    
    try {
      const highlighted = highlighter.codeToHtml(decodedCode, {
        lang: lang || 'text',
        theme: 'github-dark',
      });
      
      // Replace the original code block with highlighted version
      result = result.slice(0, m.start) + highlighted + result.slice(m.end);
    } catch (e) {
      // Language not supported by Shiki, keep original
      console.warn(`Language '${lang}' not supported by Shiki`);
    }
  }
  
  return result;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function processMarkdown() {
      try {
        // Step 1: Parse markdown to HTML with marked
        const rawHtml = parseMarkdownToHtml(content);
        
        if (cancelled) return;
        
        // Step 2: Highlight code blocks with Shiki
        const highlightedHtml = await highlightCodeBlocks(rawHtml);
        
        if (cancelled) return;
        
        // Step 3: Sanitize with DOMPurify
        const sanitizedHtml = DOMPurify.sanitize(highlightedHtml, {
          ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'blockquote', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div', 'figure', 'figcaption'],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'style'],
          ALLOW_DATA_ATTR: false,
        });
        
        setHtml(sanitizedHtml);
      } catch (error) {
        console.error("Markdown parsing error:", error);
        if (!cancelled) {
          // Fallback: simple markdown to HTML conversion
          setHtml(DOMPurify.sanitize(simpleMarkdownToHtml(content)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (content) {
      setIsLoading(true);
      processMarkdown();
    } else {
      setHtml("");
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [content]);

  if (isLoading) {
    return (
      <div className="prose prose-invert max-w-none">
        <p className="text-muted">Загрузка...</p>
      </div>
    );
  }

  return (
    <div 
      className="prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Simple fallback markdown parser
function simpleMarkdownToHtml(markdown: string): string {
  const html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" />')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/gim, '</p><p>')
    // Line breaks
    .replace(/\n/gim, '<br />');

  return `<p>${html}</p>`;
}