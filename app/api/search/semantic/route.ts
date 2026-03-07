import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/embeddings";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // 1. Generate embedding for the search query
    const embeddingResponse = await fetch(OPENROUTER_URL, {
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
      return NextResponse.json(
        { error: "Failed to generate query embedding" },
        { status: 500 }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data?.[0]?.embedding;

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: "No embedding returned" },
        { status: 500 }
      );
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
      return NextResponse.json({ results: [] });
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
          console.error("Failed to parse embedding for note:", note.id);
          return null;
        }
      })
      .filter((r): r is { slug: string; title: string; excerpt: string | null; similarity: number } => r !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json({ results: [] });
  }
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