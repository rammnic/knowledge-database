import { NextRequest, NextResponse } from "next/server";

/**
 * Проверить авторизационный токен из заголовка (для API)
 */
export function verifyAuth(request: NextRequest): boolean {
  const secretToken = process.env.SECRET_TOKEN;
  
  if (!secretToken) {
    console.error("❌ SECRET_TOKEN не настроен в .env");
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
 * Проверить авторизацию через cookie (для middleware/SSR)
 */
export function verifyAuthFromCookie(request: NextRequest): boolean {
  // В dev режиме пропускаем
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const secretToken = process.env.SECRET_TOKEN;
  
  if (!secretToken) {
    console.error("❌ SECRET_TOKEN не настроен в .env");
    return false;
  }
  
  const authCookie = request.cookies.get("admin_token");
  
  if (!authCookie || !authCookie.value) {
    return false;
  }
  
  return authCookie.value === secretToken;
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