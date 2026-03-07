import prisma from "@/lib/prisma";
import { PrismaClient, Prisma } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient;

interface NoteBasic {
  id: string;
  title: string;
  slug: string;
}

// Process [[wikilinks]] and create backlinks
// If allNotes is provided, use it instead of fetching from DB (optimization for batch)
// If tx is provided, use it for all DB operations (for transaction support)
export async function processBacklinks(
  noteId: string, 
  content: string, 
  allNotes?: NoteBasic[],
  tx?: PrismaTx
): Promise<void> {
  // Use provided transaction client or global prisma
  const db = tx || prisma;

  // Find all [[Note Name]] patterns
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const matches = [...content.matchAll(linkPattern)];
  
  // Get all note titles for matching (only if not provided)
  if (!allNotes) {
    allNotes = await db.note.findMany({
      where: { id: { not: noteId } },
      select: { id: true, title: true, slug: true },
    });
  }

  // Clear existing backlinks for this note
  await db.backlink.deleteMany({
    where: { sourceNoteId: noteId },
  });

  // Build backlinks data for batch insert
  const backlinksToCreate: Array<{ sourceNoteId: string; targetNoteId: string }> = [];
  
  for (const match of matches) {
    const linkedTitle = match[1];
    const linkedSlug = linkedTitle.toLowerCase().replace(/\s+/g, '-');
    
    // Ищем по title ИЛИ по slug (slug может быть на английском даже если title на русском)
    const targetNote = allNotes.find(
      (n) => n.title.toLowerCase() === linkedTitle.toLowerCase() 
        || n.slug.toLowerCase() === linkedSlug
    );

    if (targetNote) {
      backlinksToCreate.push({
        sourceNoteId: noteId,
        targetNoteId: targetNote.id,
      });
    }
  }

  // Batch insert all backlinks at once
  // Note: SQLite doesn't support skipDuplicates, so we use individual upserts in transaction
  if (backlinksToCreate.length > 0) {
    // If we're in a transaction, use the transaction client directly without wrapping in another transaction
    if (tx) {
      // Execute all upserts within the existing transaction
      for (const bl of backlinksToCreate) {
        await tx.backlink.upsert({
          where: {
            sourceNoteId_targetNoteId: {
              sourceNoteId: bl.sourceNoteId,
              targetNoteId: bl.targetNoteId,
            },
          },
          create: bl,
          update: {},
        });
      }
    } else {
      // Not in a transaction, create one
      await prisma.$transaction(
        backlinksToCreate.map(bl => 
          prisma.backlink.upsert({
            where: {
              sourceNoteId_targetNoteId: {
                sourceNoteId: bl.sourceNoteId,
                targetNoteId: bl.targetNoteId,
              },
            },
            create: bl,
            update: {},
          })
        )
      );
    }
  }
}
