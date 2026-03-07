/**
 * Скрипт очистки всех данных в PostgreSQL
 * 
 * Использование:
 * 1. Убедитесь что PostgreSQL запущен
 * 2. Запустите скрипт: npx tsx scripts/clear-postgres.ts
 * 
 * ВНИМАНИЕ: Скрипт удалит ВСЕ данные!
 */

import { prisma } from '@/lib/prisma';

async function clear() {
  console.log('⚠️  Очистка ВСЕХ данных из PostgreSQL...\n');

  try {
    // Удаляем в правильном порядке (учитывая foreign keys)
    console.log('🗑️  Удаление NoteTags...');
    await prisma.noteTag.deleteMany();
    
    console.log('🗑️  Удаление Backlinks...');
    await prisma.backlink.deleteMany();
    
    console.log('🗑️  Удаление Notes...');
    await prisma.note.deleteMany();
    
    console.log('🗑️  Удаление Tags...');
    await prisma.tag.deleteMany();
    
    console.log('🗑️  Удаление Users...');
    await prisma.user.deleteMany();
    
    console.log('🗑️  Удаление Settings...');
    await prisma.settings.deleteMany();

    console.log('✅ Очистка завершена успешно!\n');

    // Проверка
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.note.count(),
      prisma.tag.count(),
      prisma.noteTag.count(),
      prisma.backlink.count(),
    ]);
    
    console.log('📊 Остаток в базе данных:');
    console.log(`   - Users: ${counts[0]}`);
    console.log(`   - Notes: ${counts[1]}`);
    console.log(`   - Tags: ${counts[2]}`);
    console.log(`   - NoteTags: ${counts[3]}`);
    console.log(`   - Backlinks: ${counts[4]}`);

  } catch (error) {
    console.error('❌ Ошибка очистки:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clear();
