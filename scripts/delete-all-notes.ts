/**
 * Скрипт для удаления всех заметок из базы данных
 * 
 * Запуск: npx tsx scripts/delete-all-notes.ts
 */

import { prisma } from '@/lib/prisma';

async function main() {
  console.log('🗑️  Удаление всех заметок...\n');

  // Подсчитываем сколько всего есть
  const noteCount = await prisma.note.count();
  const tagCount = await prisma.tag.count();
  const backlinkCount = await prisma.backlink.count();

  console.log(`Текущее количество:`);
  console.log(`  - Заметок: ${noteCount}`);
  console.log(`  - Тегов: ${tagCount}`);
  console.log(`  - Backlinks: ${backlinkCount}`);
  console.log('');

  if (noteCount === 0) {
    console.log('✅ Заметок нет, нечего удалять!');
    return;
  }

  // Удаляем связи NoteTag (теги)
  await prisma.noteTag.deleteMany({});
  console.log('✓ Связи тегов удалены');

  // Удаляем backlinks
  await prisma.backlink.deleteMany({});
  console.log('✓ Backlinks удалены');

  // Удаляем все заметки
  const deletedNotes = await prisma.note.deleteMany({});
  console.log(`✓ Удалено заметок: ${deletedNotes.count}`);

  console.log('\n✅ Все заметки удалены!');
}

main()
  .catch((e) => {
    console.error('\n❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });