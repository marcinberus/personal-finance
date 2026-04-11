import { PrismaService } from '../../../src/prisma/prisma.service';

/**
 * Deletes all rows from every application table in FK-safe order so each
 * test starts with a clean database while the container keeps running.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('DELETE FROM "OutboxMessage"');
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
}
