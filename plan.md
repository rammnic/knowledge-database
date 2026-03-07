📋 План разработки Knowledge Database
Обзор проекта
Создание базы знаний с интерактивным графом связей, Markdown-редактором и AI-ассистентом. Используем референс site_rammnic как основу для стилей и Docker-деплоя.

🏗️ Архитектура
Технологический стек
Категория	Технология
Framework	Next.js 15 (App Router)
Language	TypeScript (Strict mode)
Styling	Tailwind CSS + Framer Motion
UI Library	Shadcn/UI + Lucide Icons
Database	PostgreSQL + Prisma ORM
Search	FlexSearch + OpenRouter SDK
Graph	react-force-graph-2d
Auth	NextAuth.js
Markdown	Unified/Remark/Rehype + Shiki
Security	DOMPurify + Server Actions
Структура базы данных (Prisma Schema)

// Основные модели
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  notes     Note[]
  createdAt DateTime @default(now())
}

model Note {
  id          String       @id @default(cuid())
  title       String
  slug        String       @unique
  content     String       // Markdown
  excerpt     String?
  status      NoteStatus   @default(DRAFT)
  maturity    Maturity     @default(SEED)
  authorId    String
  author      User         @relation(fields: [authorId], references: [id])
  tags        NoteTag[]
  backlinks   Backlink[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Tag {
  id      String    @id @default(cuid())
  name    String    @unique
  slug    String    @unique
  notes   NoteTag[]
}

model Backlink {
  id           String  @id @default(cuid())
  sourceNoteId String
  targetNoteId String
  sourceNote   Note    @relation("SourceNote", fields: [sourceNoteId], references: [id])
  targetNote   Note    @relation("TargetNote", fields: [targetNoteId], references: [id])
  createdAt    DateTime @default(now())
}

enum NoteStatus { DRAFT, PUBLIC }
enum Maturity { SEED, SAPLING, EVERGREEN }
enum Role { USER, ADMIN }
📁 Структура директорий

knowledge_database/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Dashboard
│   │   ├── notes/[slug]/page.tsx # Article View
│   │   └── search/page.tsx       # Search Results
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── page.tsx          # Admin Dashboard
│   │   │   ├── notes/page.tsx    # Notes List
│   │   │   └── editor/[id]/page.tsx # Editor
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── notes/route.ts
│   │   ├── search/route.ts
│   │   └── graph/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                       # Shadcn/UI компоненты
│   ├── dashboard/
│   │   ├── KnowledgeGraph.tsx
│   │   ├── StatsCards.tsx
│   │   ├── AISearch.tsx
│   │   └── RecentActivity.tsx
│   ├── editor/
│   │   ├── MarkdownEditor.tsx
│   │   ├── LivePreview.tsx
│   │   └── AIPanel.tsx
│   └── article/
│       ├── TableOfContents.tsx
│       ├── MarkdownRenderer.tsx
│       └── ContextPanel.tsx
├── lib/
│   ├── prisma.ts
│   ├── markdown.ts              # Unified/Remark парсер
│   ├── backlinks.ts             # Логика bi-directional links
│   ├── search.ts                # FlexSearch + OpenRouter
│   └── ai.ts                    # OpenRouter integration
└── prisma/
    └── schema.prisma
🚀 Этапы разработки (Roadmap)
Этап 1: Foundation (Настройка проекта)
 Инициализация Next.js 15 + TypeScript (strict)
 Настройка Tailwind CSS с кастомной темой (Deep Navy / Charcoal)
 Установка и настройка Shadcn/UI
 Настройка Prisma + PostgreSQL
 Docker конфигурация (Dockerfile, docker-compose)
 Базовый layout с навигацией
Этап 2: Database & Auth
 Prisma Schema (Notes, Tags, Backlinks, Users)
 NextAuth.js интеграция
 Защита admin-роутов
 Server Actions для CRUD операций
Этап 3: Dashboard (Bento Grid)
 Bento Grid layout компонент
 Knowledge Graph (react-force-graph-2d)
 Stats карточки с maturity индикаторами
 AI Search компонент (FlexSearch + OpenRouter)
 Recent Activity виджет
Этап 4: Article View
 3-column layout (ToC, Content, Context)
 Markdown renderer (Unified/Remark/Rehype)
 Shiki подсветка кода (TypeScript, Rust)
 Scroll-spy для ToC
 Context Panel (Backlinks, мини-граф)
Этап 5: Editor & Admin
 Split-screen Markdown редактор
 Live Preview
 File Explorer (боковая панель)
 AI Panel (Optimize кнопка)
 Status система (Draft / Public)
Этап 6: Bi-directional Links
 Парсинг [[Note Name]] синтаксиса
 Автоматическое создание Backlinks
 Обновление связей при редактировании
 Визуализация в графе
Этап 7: AI Integration
 OpenRouter SDK setup
 Семантический поиск
 Авто-генерация тегов
 Оптимизация контента
Этап 8: Polish & Deploy
 Glassmorphism эффекты
 Анимации (Framer Motion)
 Security audit (DOMPurify)
 Performance оптимизация
 Production Docker build
🎨 Дизайн-система
Цветовая палитра (Dark Mode by default)

--background: #0a0f1a      /* Deep Navy */
--surface: #141b2d         /* Charcoal */
--border: rgba(255,255,255,0.08)
--primary: #22d3ee         /* Cyan */
--accent: #8b5cf6          /* Purple */
--text-primary: #ffffff
--text-secondary: rgba(255,255,255,0.7)
Компоненты
Скругление: rounded-2xl
Glassmorphism: backdrop-blur-xl + bg-white/5
Тени: кастомные glow-эффекты
Типографика: Inter (основной), JetBrains Mono (код)
⚠️ Риски и решения
Риск	Решение
Производительность графа при большом количестве заметок	Виртуализация, lazy loading, лимит отображаемых нод
Безопасность Markdown	DOMPurify санитизация, whitelist тегов
Сложность bi-directional links	Транзакции Prisma, background jobs для обновления
OpenRouter rate limits	Кэширование ответов, fallback на FlexSearch