import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all public notes with tags
    const notes: Array<{
      id: string;
      title: string;
      slug: string;
      maturity: string;
      tags: Array<{ tag: { name: string } }>;
    }> = await prisma.note.findMany({
      where: { status: "PUBLIC" },
      select: {
        id: true,
        title: true,
        slug: true,
        maturity: true,
        tags: {
          include: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Get all backlinks
    const backlinks: Array<{
      sourceNoteId: string;
      targetNoteId: string;
    }> = await prisma.backlink.findMany({
      select: {
        sourceNoteId: true,
        targetNoteId: true,
      },
    });

    // Transform to graph format
    const nodes = notes.map((note) => ({
      id: note.id,
      name: note.title,
      slug: note.slug,
      maturity: note.maturity,
      val: 1,
      tags: note.tags.map((t) => t.tag.name),
    }));

    // Collect all links
    const links: Array<{
      source: string;
      target: string;
      type: "BACKLINK" | "TAG" | "AI";
      weight: number;
    }> = [];

    // Add backlinks
    const existingLinks = new Set<string>();
    backlinks.forEach((link) => {
      const key = `${link.sourceNoteId}-${link.targetNoteId}`;
      const reverseKey = `${link.targetNoteId}-${link.sourceNoteId}`;
      if (!existingLinks.has(key) && !existingLinks.has(reverseKey)) {
        existingLinks.add(key);
        links.push({
          source: link.sourceNoteId,
          target: link.targetNoteId,
          type: "BACKLINK",
          weight: 2,
        });
        
        // Increase node value for backlinks
        const sourceNode = nodes.find((n) => n.id === link.sourceNoteId);
        const targetNode = nodes.find((n) => n.id === link.targetNoteId);
        if (sourceNode) sourceNode.val += 0.5;
        if (targetNode) targetNode.val += 0.5;
      }
    });

    // Add tag-based links
    const noteTagsMap = new Map<string, Set<string>>();
    nodes.forEach((node) => {
      noteTagsMap.set(node.id, new Set(node.tags));
    });

    // Find pairs of notes with common tags
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        const tagsA = noteTagsMap.get(nodeA.id) || new Set();
        const tagsB = noteTagsMap.get(nodeB.id) || new Set();
        
        // Find common tags
        const commonTags = [...tagsA].filter((tag) => tagsB.has(tag));
        
        if (commonTags.length > 0) {
          const key = `${nodeA.id}-${nodeB.id}`;
          const reverseKey = `${nodeB.id}-${nodeA.id}`;
          
          if (!existingLinks.has(key) && !existingLinks.has(reverseKey)) {
            existingLinks.add(key);
            links.push({
              source: nodeA.id,
              target: nodeB.id,
              type: "TAG",
              weight: commonTags.length, // Weight = number of common tags
            });
            
            // Increase node value
            nodeA.val += 0.3 * commonTags.length;
            nodeB.val += 0.3 * commonTags.length;
          }
        }
      }
    }

    // Get notes with embeddings
    const notesWithEmbeddings = await prisma.note.findMany({
      where: { 
        status: "PUBLIC",
        NOT: { embedding: null }
      },
      select: {
        id: true,
        embedding: true,
      },
    });

    // If we have embeddings, calculate AI similarity
    if (notesWithEmbeddings.length > 1) {
      const embeddingMap = new Map<string, number[]>();
      
      notesWithEmbeddings.forEach((note) => {
        if (note.embedding) {
          try {
            const embedding = JSON.parse(note.embedding);
            embeddingMap.set(note.id, embedding);
          } catch (e) {
            console.error("Failed to parse embedding for note:", note.id);
          }
        }
      });

      // Calculate cosine similarity between all pairs
      const embeddingNotes = nodes.filter((n) => embeddingMap.has(n.id));
      
      for (let i = 0; i < embeddingNotes.length; i++) {
        for (let j = i + 1; j < embeddingNotes.length; j++) {
          const nodeA = embeddingNotes[i];
          const nodeB = embeddingNotes[j];
          
          const embA = embeddingMap.get(nodeA.id);
          const embB = embeddingMap.get(nodeB.id);
          
          if (embA && embB) {
            const similarity = cosineSimilarity(embA, embB);
            
            // Only add AI link if similarity > 0.7
            if (similarity > 0.7) {
              const key = `${nodeA.id}-${nodeB.id}`;
              const reverseKey = `${nodeB.id}-${nodeA.id}`;
              
              if (!existingLinks.has(key) && !existingLinks.has(reverseKey)) {
                existingLinks.add(key);
                links.push({
                  source: nodeA.id,
                  target: nodeB.id,
                  type: "AI",
                  weight: Math.round(similarity * 5), // Scale to 1-5
                });
                
                nodeA.val += 0.2;
                nodeB.val += 0.2;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error("Failed to fetch graph data:", error);
    return NextResponse.json({ nodes: [], links: [] });
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