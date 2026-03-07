import { redirect } from "next/navigation";
import { verifyAuth } from "@/lib/auth";
import { Suspense } from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple auth check - in production use proper session
  const hasAuth = process.env.SECRET_TOKEN;
  
  if (!hasAuth) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      {/* Admin Header */}
      <header className="glass border-b border-glass-border py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
<Link href="/admin" className="text-lg font-semibold text-gradient">
              ⚙️ Админ-панель
            </Link>
            <nav className="flex gap-4 text-sm">
<Link href="/admin/notes" className="text-muted hover:text-white transition-colors">
                Заметки
              </Link>
<Link href="/admin/editor" className="text-muted hover:text-white transition-colors">
                Создать
              </Link>
            </nav>
          </div>
<Link href="/" className="text-sm text-muted hover:text-white transition-colors">
            ← На сайт
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}