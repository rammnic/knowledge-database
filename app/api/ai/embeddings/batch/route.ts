import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/embeddings";
const DEFAULT_MODEL = "openai/text-embedding-3-small";

export async function POST(request: NextRequest) {
  console.log("📦 Starting embeddings generation...");
  
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    
    if (!apiKey) {
      console.error("❌ OPENROUTER_API_KEY not configured");
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Get notes - all if force=true, only without embeddings otherwise
    const notesToProcess = await prisma.note.findMany({
      where: force ? {} : { embedding: null },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    console.log(`📋 Found ${notesToProcess.length} notes to process (force: ${force})`);

    if (notesToProcess.length === 0) {
      console.log("✅ No notes to process");
      return NextResponse.json({ 
        message: "No notes to process",
        processed: 0,
        success: 0,
        errors: 0
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const note of notesToProcess) {
      try {
        const content = note.content || note.title;
        
        if (!content || content.trim().length === 0) {
          console.log(`⚠️ Note ${note.id} has empty content`);
          results.push({ noteId: note.id, success: false, error: "Empty content" });
          errorCount++;
          continue;
        }

        console.log(`🔄 Processing note: ${note.title}`);

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
            input: content.substring(0, 8000),
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`❌ OpenRouter API error for ${note.title}:`, error);
          results.push({ noteId: note.id, success: false, error: "API error" });
          errorCount++;
          continue;
        }

        const data = await response.json();
        console.log("📥 OpenRouter response:", JSON.stringify(data).substring(0, 200));
        
        const embedding = data.data?.[0]?.embedding;

        if (embedding) {
          await prisma.note.update({
            where: { id: note.id },
            data: { embedding: JSON.stringify(embedding) },
          });
          console.log(`✅ Saved embedding for: ${note.title}`);
          results.push({ noteId: note.id, success: true });
          successCount++;
        } else {
          console.log(`⚠️ No embedding returned for: ${note.title}`);
          results.push({ noteId: note.id, success: false, error: "No embedding returned" });
          errorCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to process note ${note.id}:`, error);
        results.push({ noteId: note.id, success: false, error: "Processing error" });
        errorCount++;
      }
    }

    console.log(`📊 Embeddings generation complete: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      message: `Processed ${notesToProcess.length} notes`,
      success: successCount,
      errors: errorCount,
      results: results.slice(0, 50), // Limit response size
    });
  } catch (error) {
    console.error("❌ Batch embedding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get status of embeddings
export async function GET() {
  try {
    const totalNotes = await prisma.note.count();
    const notesWithEmbeddings = await prisma.note.count({
      where: {
        NOT: { embedding: null },
      },
    });

    return NextResponse.json({
      total: totalNotes,
      withEmbeddings: notesWithEmbeddings,
      withoutEmbeddings: totalNotes - notesWithEmbeddings,
    });
  } catch (error) {
    console.error("Failed to get embedding status:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}