import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Пути, которые не требуют авторизации
const publicPaths = [
  '/admin/login',
  '/api/auth/login',
  '/api/auth/logout',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // В dev режиме пропускаем все запросы
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Проверяем только админские пути
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Публичные пути в админке (login, auth API)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Проверяем auth cookie
  const authCookie = request.cookies.get('admin_token');

  if (!authCookie || !authCookie.value) {
    // Нет cookie - редиректим на страницу логина
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Проверяем валидность токена
  const secretToken = process.env.SECRET_TOKEN;
  if (authCookie.value !== secretToken) {
    // Невалидный токен - удаляем cookie и редиректим на логин
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('admin_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};