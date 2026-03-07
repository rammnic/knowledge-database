import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/embeddings";
const DEFAULT_MODEL = "openai/text-embedding-3-small";

export async function POST(request: Request) {
  try {
    const { noteId, content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Get OpenRouter API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Call OpenRouter API to get embedding
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://knowledge-database.com",
        "X-Title": "Knowledge Database",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: content.substring(0, 8000), // Limit to 8000 chars to save tokens
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      return NextResponse.json(
        { error: "Failed to get embedding from OpenRouter" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;

    if (!embedding) {
      return NextResponse.json(
        { error: "No embedding returned from OpenRouter" },
        { status: 500 }
      );
    }

    // If noteId is provided, save embedding to database
    if (noteId) {
      const prisma = (await import("@/lib/prisma")).default;
      
      await prisma.note.update({
        where: { id: noteId },
        data: {
          embedding: JSON.stringify(embedding),
        },
      });
    }

    return NextResponse.json({
      success: true,
      embedding,
      dimensions: embedding.length,
    });
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Batch endpoint to generate embeddings for multiple notes
export async function PUT(request: Request) {
  try {
    const { noteIds } = await request.json();

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json(
        { error: "noteIds array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const prisma = (await import("@/lib/prisma")).default;
    const results = [];

    for (const noteId of noteIds) {
      try {
        const note = await prisma.note.findUnique({
          where: { id: noteId },
          select: { content: true },
        });

        if (!note || !note.content) {
          results.push({ noteId, success: false, error: "Note not found or empty" });
          continue;
        }

        // Call OpenRouter API
        const response = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://knowledge-database.com",
            "X-Title": "Knowledge Database",
          },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            input: note.content.substring(0, 8000),
          }),
        });

        if (!response.ok) {
          results.push({ noteId, success: false, error: "OpenRouter API error" });
          continue;
        }

        const data = await response.json();
        const embedding = data.data?.[0]?.embedding;

        if (embedding) {
          await prisma.note.update({
            where: { id: noteId },
            data: { embedding: JSON.stringify(embedding) },
          });
          results.push({ noteId, success: true });
        } else {
          results.push({ noteId, success: false, error: "No embedding returned" });
        }
      } catch (error) {
        console.error(`Failed to process note ${noteId}:`, error);
        results.push({ noteId, success: false, error: "Processing error" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Batch embedding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}