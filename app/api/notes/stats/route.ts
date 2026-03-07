import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [total, seed, sapling, evergreen] = await Promise.all([
      prisma.note.count({ where: { status: "PUBLIC" } }),
      prisma.note.count({ where: { status: "PUBLIC", maturity: "SEED" } }),
      prisma.note.count({ where: { status: "PUBLIC", maturity: "SAPLING" } }),
      prisma.note.count({ where: { status: "PUBLIC", maturity: "EVERGREEN" } }),
    ]);

    return NextResponse.json({
      total,
      seed,
      sapling,
      evergreen,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ total: 0, seed: 0, sapling: 0, evergreen: 0 });
  }
}