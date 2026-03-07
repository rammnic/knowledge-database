// Seed script for demo data
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@local" },
    update: {},
    create: {
      email: "admin@local",
      name: "Admin",
      password: "hashed",
      role: "ADMIN",
    },
  });
  console.log("✅ Created admin user");

  // Create demo notes
  const notes = [
    {
      title: "TypeScript Basics",
      slug: "typescript-basics",
      content: `# TypeScript Basics

TypeScript — это надмножество JavaScript, которое добавляет статическую типизацию.

## Основные типы

\`\`\`typescript
// Примитивные типы
let name: string = "John";
let age: number = 30;
let isActive: boolean = true;

// Массивы
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ["a", "b", "c"];

// Объекты
interface User {
  name: string;
  age: number;
  email?: string; // optional
}

const user: User = {
  name: "John",
  age: 30
};
\`\`\`

## Связанные заметки

Смотрите также: [[React Patterns]] и [[System Design]]

## Заключение

TypeScript помогает писать более надёжный код с помощью статической типизации.`,
      excerpt: "Основы TypeScript: типы, интерфейсы, дженерики",
      status: "PUBLIC" as const,
      maturity: "SEED" as const,
    },
    {
      title: "React Patterns",
      slug: "react-patterns",
      content: `# React Patterns

Полезные паттерны и практики при работе с React.

## Hooks

\`\`\`tsx
// Кастомный хук
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  
  return { count, increment, decrement };
}
\`\`\`

## Compound Components

Паттерн для создания гибких API компонентов.

\`\`\`tsx
function Toggle({ children }) {
  const [on, setOn] = useState(false);
  return children({ on, toggle: () => setOn(!on) });
}

function App() {
  return (
    <Toggle>
      {({ on, toggle }) => (
        <button onClick={toggle}>
          {on ? "ON" : "OFF"}
        </button>
      )}
    </Toggle>
  );
}
\`\`\`

## Связи

Эта заметка связана с [[TypeScript Basics]] для типизации пропсов.`,
      excerpt: "Популярные паттерны в React: Hooks, Compound Components",
      status: "PUBLIC" as const,
      maturity: "SAPLING" as const,
    },
    {
      title: "System Design",
      slug: "system-design",
      content: `# System Design

Основы проектирования масштабируемых систем.

## Принципы

1. **Scalability** — способность системы обрабатывать растущую нагрузку
2. **Reliability** — устойчивость к отказам
3. **Availability** — доступность системы
4. **Maintainability** — простота поддержки и развития

## Архитектурные паттерны

### Microservices
Разделение приложения на независимые сервисы.

### Event-Driven Architecture
Асинхронная обработка событий через message queues.

### CQRS
Разделение операций чтения и записи.

## Базы данных

- **SQL** (PostgreSQL): для структурированных данных с сложными связями
- **NoSQL** (MongoDB): для гибких схем и высокой производительности
- **Cache** (Redis): для часто запрашиваемых данных

## Связанные темы

Смотрите также:
- [[TypeScript Basics]]
- [[React Patterns]]
- [[Docker Guide]]`,
      excerpt: "Проектирование масштабируемых систем: принципы и паттерны",
      status: "PUBLIC" as const,
      maturity: "EVERGREEN" as const,
    },
    {
      title: "Docker Guide",
      slug: "docker-guide",
      content: `# Docker Guide

Руководство по работе с Docker.

## Основные команды

\`\`\`bash
# Запуск контейнера
docker run -d -p 3000:3000 myapp

# Просмотр логов
docker logs -f container_id

# Остановка контейнера
docker stop container_id
\`\`\`

## Dockerfile пример

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Docker Compose

\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
\`\`\`

## Связи

Смотрите также: [[System Design]] для понимания архитектуры.`,
      excerpt: "Работа с Docker: основы, Dockerfile, Docker Compose",
      status: "PUBLIC" as const,
      maturity: "SAPLING" as const,
    },
  ];

  for (const note of notes) {
    await prisma.note.upsert({
      where: { slug: note.slug },
      update: note,
      create: {
        ...note,
        authorId: admin.id,
      },
    });
    console.log(`✅ Created note: ${note.title}`);
  }

  // Create some tags
  const tags = ["typescript", "react", "system-design", "docker", "programming"];
  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: {
        name: tagName.charAt(0).toUpperCase() + tagName.slice(1),
        slug: tagName,
      },
    });
  }
  console.log("✅ Created tags");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });