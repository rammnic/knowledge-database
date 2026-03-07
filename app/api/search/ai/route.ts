import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const OPENROUTER_EMBEDDING_URL = "https://openrouter.ai/api/v1/embeddings";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

// Simple in-memory cache
const searchCache = new Map<string, { results: any[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Check cache
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ results: cached.results });
  }

  // Check if OpenRouter API key is available
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    // Fallback to simple search
    return simpleSearch(query);
  }

  try {
    // Use semantic search with embeddings
    const results = await semanticSearch(query, apiKey);
    
    if (results.length > 0) {
      // Cache results
      searchCache.set(query, { results, timestamp: Date.now() });
      return NextResponse.json({ results });
    }
    
    // Fallback to simple search if no embeddings available
    return simpleSearch(query);
  } catch (error) {
    console.error("AI search failed:", error);
    return simpleSearch(query);
  }
}

// Semantic search using embeddings
async function semanticSearch(query: string, apiKey: string) {
  // 1. Generate embedding for the search query
  const embeddingResponse = await fetch(OPENROUTER_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://knowledge-database.com",
      "X-Title": "Knowledge Database",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: query.substring(0, 8000),
    }),
  });

  if (!embeddingResponse.ok) {
    console.error("OpenRouter embedding error:", await embeddingResponse.text());
    return [];
  }

  const embeddingData = await embeddingResponse.json();
  const queryEmbedding = embeddingData.data?.[0]?.embedding;

  if (!queryEmbedding) {
    return [];
  }

  // 2. Get all public notes with embeddings
  const notesWithEmbeddings = await prisma.note.findMany({
    where: {
      status: "PUBLIC",
      NOT: { embedding: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      embedding: true,
    },
  });

  if (notesWithEmbeddings.length === 0) {
    return [];
  }

  // 3. Calculate cosine similarity for each note
  const results = notesWithEmbeddings
    .map((note) => {
      try {
        const noteEmbedding = JSON.parse(note.embedding!);
        const similarity = cosineSimilarity(queryEmbedding, noteEmbedding);
        return {
          slug: note.slug,
          title: note.title,
          excerpt: note.excerpt,
          similarity,
        };
      } catch (e) {
        return null;
      }
    })
    .filter((r): r is { slug: string; title: string; excerpt: string | null; similarity: number } => r !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  return results;
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

async function simpleSearch(query: string) {
  try {
    const queryLower = query.toLowerCase();
    const notes: Array<{
      slug: string;
      title: string;
      excerpt: string | null;
      content: string;
    }> = await prisma.note.findMany({
      where: {
        status: "PUBLIC",
      },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        content: true,
      },
      take: 20,
    });

    // SQLite doesn't support case-insensitive contains, so filter in JS
    const results = notes
      .filter((note) => 
        note.title.toLowerCase().includes(queryLower) ||
        note.content.toLowerCase().includes(queryLower)
      )
      .slice(0, 10)
      .map(note => ({
        slug: note.slug,
        title: note.title,
        excerpt: note.excerpt,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Simple search failed:", error);
    return NextResponse.json({ results: [] });
  }
}
