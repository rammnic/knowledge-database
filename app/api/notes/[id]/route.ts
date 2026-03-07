import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        author: { select: { name: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Failed to fetch note:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

// PUT - Update note (protected)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { title, content, status, maturity } = await request.json();
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

    return NextResponse.json(note);
  } catch (error) {
    console.error("Failed to update note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE - Delete note (protected)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}

// Process [[wikilinks]] and create backlinks
async function processBacklinks(noteId: string, content: string) {
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const matches = [...content.matchAll(linkPattern)];
  
  const allNotes: Array<{ id: string; title: string }> = await prisma.note.findMany({
    where: { id: { not: noteId } },
    select: { id: true, title: true },
  });

  await prisma.backlink.deleteMany({
    where: { sourceNoteId: noteId },
  });

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
      }).catch(() => {});
    }
  }
}
