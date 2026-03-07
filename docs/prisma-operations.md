# Prisma - Справочник операций

> Справочное руководство по типовым операциям с базой данных через Prisma ORM

## Содержание

- [CLI команды](#cli-команды)
- [Подключение к БД](#подключение-к-бд)
- [CRUD операции](#crud-операции)
  - [Note (заметки)](#note-заметки)
  - [User (пользователи)](#user-пользователи)
  - [Tag (теги)](#tag-теги)
- [Специальные операции](#специальные-операции)
- [Скрипты для администрирования](#скрипты-для-администрирования)

---

## CLI команды

```bash
# Открыть визуальный редактор БД (браузер)
npx prisma studio

# Создать миграцию после изменения schema.prisma
npx prisma migrate dev --name <имя_миграции>

# Применить миграции (production)
npx prisma migrate deploy

# Синхронизировать БД со схемой (без миграций, для dev)
npx prisma db push

# Импортировать схему из существующей БД
npx prisma db pull

# Сбросить БД и применить все миграции заново
npx prisma migrate reset

# Сгенерировать Prisma Client
npx prisma generate
```

---

## Подключение к БД

```typescript
import { prisma } from '@/lib/prisma';

// Или создать новый экземпляр
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

---

## CRUD операции

### Note (заметки)

#### Создание

```typescript
// Создать одну заметку
const note = await prisma.note.create({
  data: {
    title: 'Моя заметка',
    slug: 'moja-zametka',
    content: '# Заголовок\nКонтент заметки...',
    authorId: 'user_id_здесь',
    status: 'DRAFT',
    maturity: 'SEED',
  },
});

// Создать с тегами
const noteWithTags = await prisma.note.create({
  data: {
    title: 'Заметка с тегами',
    slug: 'zametka-s-tegami',
    content: 'Контент...',
    authorId: 'user_id_здесь',
    tags: {
      create: [
        { tag: { connect: { slug: 'javascript' } } },
        { tag: { connect: { slug: 'tutorial' } } },
      ],
    },
  },
  include: { tags: { include: { tag: true } } },
});
```

#### Чтение

```typescript
// Найти по ID
const noteById = await prisma.note.findUnique({
  where: { id: 'note_id_здесь' },
});

// Найти по slug
const noteBySlug = await prisma.note.findUnique({
  where: { slug: 'moja-zametka' },
});

// Найти все заметки автора
const userNotes = await prisma.note.findMany({
  where: { authorId: 'user_id_здесь' },
  orderBy: { createdAt: 'desc' },
});

// Найти с пагинацией
const paginatedNotes = await prisma.note.findMany({
  skip: 0,
  take: 10,
  orderBy: { updatedAt: 'desc' },
});

// Найти черновики
const drafts = await prisma.note.findMany({
  where: { status: 'DRAFT' },
});

// Найти опубликованные
const published = await prisma.note.findMany({
  where: { status: 'PUBLIC' },
});

// Найти с связями (теги, автор)
const noteWithRelations = await prisma.note.findUnique({
  where: { slug: 'moja-zametka' },
  include: {
    author: { select: { id: true, name: true, email: true } },
    tags: { include: { tag: true } },
    backlinks: { include: { sourceNote: true } },
  },
});
```

#### Обновление

```typescript
// Обновить заметку
const updatedNote = await prisma.note.update({
  where: { id: 'note_id_здесь' },
  data: {
    title: 'Новое название',
    content: 'Обновлённый контент',
  },
});

// Обновить статус
await prisma.note.update({
  where: { id: 'note_id_здесь' },
  data: { status: 'PUBLIC' },
});

// Добавить тег к заметке
await prisma.noteTag.create({
  data: {
    noteId: 'note_id_здесь',
    tagId: 'tag_id_здесь',
  },
});
```

#### Удаление

```typescript
// Удалить одну заметку (каскадно удалятся связи)
await prisma.note.delete({
  where: { id: 'note_id_здесь' },
});

// Удалить все заметки
await prisma.note.deleteMany({});

// Удалить черновики
await prisma.note.deleteMany({
  where: { status: 'DRAFT' },
});

// Удалить заметки автора
await prisma.note.deleteMany({
  where: { authorId: 'user_id_здесь' },
});
```

---

### User (пользователи)

```typescript
// Создать пользователя
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'Иван Иванов',
    password: 'hashed_password',
    role: 'USER',
  },
});

// Найти пользователя по email
const userByEmail = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Найти все заметки пользователя
const userNotes = await prisma.note.findMany({
  where: { authorId: 'user_id_здесь' },
});

// Обновить роль пользователя
await prisma.user.update({
  where: { id: 'user_id_здесь' },
  data: { role: 'ADMIN' },
});

// Удалить пользователя (каскадно удалятся его заметки)
await prisma.user.delete({
  where: { id: 'user_id_здесь' },
});
```

---

### Tag (теги)

```typescript
// Создать тег
const tag = await prisma.tag.create({
  data: {
    name: 'JavaScript',
    slug: 'javascript',
  },
});

// Найти тег по slug
const tagBySlug = await prisma.tag.findUnique({
  where: { slug: 'javascript' },
});

// Найти все теги
const allTags = await prisma.tag.findMany({
  orderBy: { name: 'asc' },
});

// Найти заметки с определённым тегом
const notesWithTag = await prisma.note.findMany({
  where: {
    tags: {
      some: {
        tag: { slug: 'javascript' },
      },
    },
  },
});

// Удалить тег
await prisma.tag.delete({
  where: { id: 'tag_id_здесь' },
});
```

---

## Специальные операции

### Транзакции

```typescript
// Выполнить несколько операций в транзакции
const result = await prisma.$transaction(async (tx) => {
  const note = await tx.note.create({
    data: { /* данные */ },
  });
  
  await tx.noteTag.create({
    data: { noteId: note.id, tagId: 'tag_id' },
  });
  
  return note;
});
```

### Агрегация

```typescript
// Подсчитать количество заметок
const count = await prisma.note.count();

// Подсчитать черновики
const draftCount = await prisma.note.count({
  where: { status: 'DRAFT' },
});

// Статистика по статусам
const stats = await prisma.note.groupBy({
  by: ['status'],
  _count: { status: true },
});
```

### Условия и фильтры

```typescript
// OR условие
const notes = await prisma.note.findMany({
  where: {
    OR: [
      { status: 'DRAFT' },
      { maturity: 'SEED' },
    ],
  },
});

// AND условие
const publishedEvergreen = await prisma.note.findMany({
  where: {
    AND: [
      { status: 'PUBLIC' },
      { maturity: 'EVERGREEN' },
    ],
  },
});

// NOT условие
const notDrafts = await prisma.note.findMany({
  where: {
    NOT: { status: 'DRAFT' },
  },
});

// Поиск по дате
const recentNotes = await prisma.note.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'), // больше или равно
      lte: new Date('2024-12-31'), // меньше или равно
    },
  },
});
```

---

## Скрипты для администрирования

### Удаление всех заметок

```typescript
// scripts/delete-all-notes.ts
import { prisma } from '@/lib/prisma';

async function main() {
  console.log('🗑️  Удаление всех заметок...');
  
  // Удаляем связи NoteTag (теги)
  await prisma.noteTag.deleteMany({});
  console.log('✓ Связи тегов удалены');
  
  // Удаляем backlinks
  await prisma.backlink.deleteMany({});
  console.log('✓ Backlinks удалены');
  
  // Удаляем все заметки
  const deletedNotes = await prisma.note.deleteMany({});
  console.log(`✓ Удалено заметок: ${deletedNotes.count}`);
  
  console.log('✅ Все заметки удалены!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Запуск:**
```bash
npx tsx scripts/delete-all-notes.ts
```

### Полная очистка БД

```typescript
// scripts/reset-db.ts
import { prisma } from '@/lib/prisma';

async function main() {
  console.log('⚠️  Полная очистка базы данных...');
  
  await prisma.backlink.deleteMany({});
  await prisma.noteTag.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.settings.deleteMany({});
  
  console.log('✅ База данных очищена!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Удаление всех тегов

```typescript
// Удалить все теги (связи удалятся каскадно)
await prisma.tag.deleteMany({});
```

### Удаление всех пользователей

```typescript
// Удалить всех пользователей (заметки удалятся каскадно)
await prisma.user.deleteMany({});
```

### Raw SQL (для больших объёмов)

```typescript
// Быстрое удаление через raw SQL
await prisma.$executeRaw`DELETE FROM Note`;
await prisma.$executeRaw`DELETE FROM Tag`;
await prisma.$executeRaw`DELETE FROM User`;

// Очистить таблицу полностью (сбросить автоинкремент)
await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Note'`;
```

---

## Частые задачи

| Задача | Код |
|--------|-----|
| Получить все заметки с тегами | `prisma.note.findMany({ include: { tags: { include: { tag: true } } } })` |
| Найти заметки по названию | `prisma.note.findMany({ where: { title: { contains: 'поиск' } } })` |
| Получить последние 5 заметок | `prisma.note.findMany({ take: 5, orderBy: { createdAt: 'desc' } })` |
| Получить все теги заметки | `prisma.note.findUnique({ where: { id } }).tags()` |
| Проверить существование | `prisma.note.findUnique({ where: { slug } })` |
| Обновить embedding | `prisma.note.update({ where: { id }, data: { embedding: jsonString } })` |

---

## Устранение проблем

```bash
# Если Prisma Client не обновлён
npx prisma generate

# Если миграции не применяются
npx prisma migrate dev

# Если БД повреждена - удалить и создать заново
rm prisma/dev.db
npx prisma db push

# Посмотреть SQL запрос в консоли
# Добавить в prisma.ts:
log: ['query', 'error', 'warn']