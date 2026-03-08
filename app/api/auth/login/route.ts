import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Валидация входящих данных
const loginSchema = z.object({
  token: z.string().min(1, "Токен обязателен"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = loginSchema.parse(body);

    const secretToken = process.env.SECRET_TOKEN;

    // В dev режиме принимаем любой токен
    if (process.env.NODE_ENV !== "production") {
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: "/",
      });
      return response;
    }

    // В production проверяем токен
    if (!secretToken) {
      return NextResponse.json(
        { success: false, message: "SECRET_TOKEN не настроен на сервере" },
        { status: 500 }
      );
    }

    if (token !== secretToken) {
      return NextResponse.json(
        { success: false, message: "Неверный токен" },
        { status: 401 }
      );
    }

    // Устанавливаем cookie с токеном
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}