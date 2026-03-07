import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      where: { status: "PUBLIC" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        maturity: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Failed to fetch recent notes:", error);
    return NextResponse.json({ notes: [] });
  }
}