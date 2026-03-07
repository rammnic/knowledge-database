import { Suspense } from "react";
import Link from "next/link";
import { KnowledgeGraph } from "@/components/dashboard/KnowledgeGraph";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AISearch } from "@/components/dashboard/AISearch";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function HomePage() {
  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Knowledge Database</span>
          </h1>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            Персональная база знаний с интерактивным графом связей
          </p>
        </header>

        {/* AI Search */}
        <section className="max-w-2xl mx-auto">
          <AISearch />
        </section>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Knowledge Graph - spans 2 columns */}
          <div className="md:col-span-2 lg:col-span-2 min-h-[400px]">
            <Suspense fallback={<GraphSkeleton />}>
              <KnowledgeGraph />
            </Suspense>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4">
            <StatsCards />
          </div>

          {/* Recent Activity */}
          <div className="md:col-span-2 lg:col-span-2">
            <RecentActivity />
          </div>

          {/* Quick Links / Placeholder */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Быстрые ссылки</h3>
            <div className="space-y-2">
<Link
                href="/admin"
                className="block p-3 rounded-xl surface hover:surface-hover transition-colors"
              >
                <span className="text-primary-light">→</span> Админ-панель
              </Link>
<Link
                href="/notes"
                className="block p-3 rounded-xl surface hover:surface-hover transition-colors"
              >
                <span className="text-primary-light">→</span> Все заметки
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function GraphSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted">Загрузка графа знаний...</p>
      </div>
    </div>
  );
}