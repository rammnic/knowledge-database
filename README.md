# Knowledge Database

Персональная база знаний с интерактивным графом связей, Markdown-редактором и AI-ассистентом.

## 🚀 Технологический стек

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS + Framer Motion
- **UI**: Radix UI + Lucide Icons
- **Database**: PostgreSQL + Prisma ORM
- **Search**: FlexSearch + OpenRouter SDK (AI embeddings)
- **Graph**: react-force-graph-2d
- **Auth**: Token-based (SECRET_TOKEN)
- **Markdown**: Marked + Shiki + DOMPurify

## 📦 Установка

```bash
# Установка зависимостей
npm install

# Генерация Prisma Client
npx prisma generate

# Запуск в режиме разработки
npm run dev
```

## 🐳 Docker (Production)

```bash
# Копировать .env файл и настроить переменные
cp .env.example .env

# Запуск через Docker Compose
docker-compose up -d

# Остановка
docker-compose down
```

## 📝 Переменные окружения

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://knowledge:password@localhost:5432/knowledge"
DB_PASSWORD="your-secure-password"

# Security
SECRET_TOKEN="your-admin-secret-token"
NEXT_PUBLIC_SECRET_TOKEN="your-admin-secret-token"

# AI (OpenRouter)
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="google/gemini-2.0-flash-001"

# App URL
NEXT_PUBLIC_URL="http://localhost:3000"
```

## 🎨 Структура проекта

```
├── app/                      # Next.js App Router
│   ├── page.tsx              # Dashboard (публичный)
│   ├── notes/[slug]/         # Просмотр заметки
│   ├── admin/                # Admin панель
│   │   ├── page.tsx          # Admin Dashboard
│   │   ├── editor/           # Markdown Editor
│   │   └── notes/            # Управление заметками
│   └── api/                  # API Routes
│       ├── notes/            # CRUD заметок
│       ├── search/           # Поиск (FlexSearch + AI)
│       ├── graph/            # Граф связей
│       └── ai/               # AI функции (embeddings, optimize)
├── components/
│   ├── dashboard/            # KnowledgeGraph, Stats, AISearch
│   └── article/              # MarkdownRenderer, ToC, Context
├── lib/                      # Утилиты
│   ├── auth.ts               # Аутентификация
│   ├── prisma.ts             # Prisma client
│   └── utils.ts              # Общие утилиты
└── prisma/
    └── schema.prisma         # База данных
```

## ✨ Функции

- **Knowledge Graph**: Интерактивный граф связей между заметками
- **Bi-directional Links**: Автоматическое создание backlinks через `[[Note Name]]`
- **AI Search**: Семантический поиск через OpenRouter embeddings
- **AI Optimize**: Авто-улучшение контента через AI
- **Markdown Editor**: Split-screen редактор с Live Preview
- **Maturity Levels**: 🌱 Seed → 🌿 Sapling → 🌳 Evergreen
- **Embeddings**: Векторные представления для семантического поиска

## 🔧 Скрипты

```bash
npm run dev          # Запуск dev сервера
npm run build        # Production build
npm run start        # Запуск production сервера
npm run lint         # Линтинг
npm run db:generate  # Генерация Prisma Client
npm run db:push      # Синхронизация схемы БД
npm run db:studio    # Открыть Prisma Studio
```

## 📄 License

MIT
