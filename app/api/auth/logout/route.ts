import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Удаляем auth cookie
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0, // Немедленное удаление
    path: "/",
  });

  return response;
}