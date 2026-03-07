import { NextRequest, NextResponse } from "next/server";

/**
 * Проверить авторизационный токен из заголовка
 */
export function verifyAuth(request: NextRequest): boolean {
  const secretToken = process.env.NEXT_PUBLIC_SECRET_TOKEN;
  
  if (!secretToken) {
    console.error("❌ NEXT_PUBLIC_SECRET_TOKEN не настроен в .env");
    return false;
  }
  
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader) {
    return false;
  }
  
  // Поддерживаем формат: "Bearer <token>"
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return token === secretToken;
  }
  
  // Также поддерживаем токен напрямую
  return authHeader === secretToken;
}

/**
 * Middleware для проверки авторизации API
 */
export function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Требуется авторизация" },
        { status: 401 }
      );
    }
    
    return handler(request);
  };
}

/**
 * Создать ответ "401 Unauthorized"
 */
export function unauthorizedResponse(message: string = "Требуется авторизация") {
  return NextResponse.json(
    { error: "Unauthorized", message },
    { status: 401 }
  );
}