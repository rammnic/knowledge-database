import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// GET - List all notes (public)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const tag = searchParams.get("tag");

  try {
    const where: any = {};
    if (status) where.status = status;
    
    const notes = await prisma.note.findMany({
      where,
      include: {
        author: { select: { name: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json({ notes: [] });
  }
}

// POST - Create new note (protected)
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content, status, maturity } = await request.json();
    const slug = slugify(title);

    // Get or create default user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "admin@local",
          name: "Admin",
          password: "hashed",
          role: "ADMIN",
        },
      });
    }

    // Extract excerpt from content
    const excerpt = content?.slice(0, 200) + (content?.length > 200 ? "..." : "");

    const note = await prisma.note.create({
      data: {
        title,
        slug,
        content: content || "",
        excerpt,
        status: status || "DRAFT",
        maturity: maturity || "SEED",
        authorId: user.id,
      },
    });

    // Process bi-directional links
    await processBacklinks(note.id, content || "");

    // Generate embedding asynchronously (don't wait)
    generateEmbedding(note.id, content || "").catch(console.error);

    return NextResponse.json(note);
  } catch (error) {
    console.error("Failed to create note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

// PUT - Update note (protected)
export async function PUT(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, title, content, status, maturity } = await request.json();
    const slug = slugify(title);
    const excerpt = content?.slice(0, 200) + (content?.length > 200 ? "..." : "");

    const note = await prisma.note.update({
      where: { id },
      data: {
        title,
        slug,
        content: content || "",
        excerpt,
        status: status || "DRAFT",
        maturity: maturity || "SEED",
      },
    });

    // Process bi-directional links
    await processBacklinks(note.id, content || "");

    // Generate embedding asynchronously (don't wait)
    generateEmbedding(note.id, content || "").catch(console.error);

    return NextResponse.json(note);
  } catch (error) {
    console.error("Failed to update note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// Process [[wikilinks]] and create backlinks
async function processBacklinks(noteId: string, content: string) {
  // Find all [[Note Name]] patterns
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const matches = [...content.matchAll(linkPattern)];
  
  // Get all note titles for matching
  const allNotes: Array<{ id: string; title: string }> = await prisma.note.findMany({
    where: { id: { not: noteId } },
    select: { id: true, title: true },
  });

  // Clear existing backlinks for this note
  await prisma.backlink.deleteMany({
    where: { sourceNoteId: noteId },
  });

  // Create new backlinks
  for (const match of matches) {
    const linkedTitle = match[1];
    const targetNote = allNotes.find(
      (n) => n.title.toLowerCase() === linkedTitle.toLowerCase()
    );

    if (targetNote) {
      await prisma.backlink.create({
        data: {
          sourceNoteId: noteId,
          targetNoteId: targetNote.id,
        },
      }).catch(() => {}); // Ignore duplicates
    }
  }
}

// Generate embedding for a note
async function generateEmbedding(noteId: string, content: string) {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/ai/embedding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, content }),
    });
    
    if (!response.ok) {
      console.error("Failed to generate embedding:", await response.text());
    }
  } catch (error) {
    console.error("Error generating embedding:", error);
  }
}
