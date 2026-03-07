import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

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
      .filter(note => 
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
    console.error("Search failed:", error);
    return NextResponse.json({ results: [] });
  }
}
