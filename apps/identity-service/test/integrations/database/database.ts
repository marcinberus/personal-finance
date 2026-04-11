import { PrismaService } from '@app/prisma';

/**
 * Deletes all rows from every application table in FK-safe order so each
 * test starts with a clean database while the container keeps running.
 *
 * Order: transactions → categories → users (Transaction.category is RESTRICT,
 * so transactions must go first; CASCADE on User covers the rest).
 *
 * Sequential deleteMany calls are used intentionally — Prisma's batch
 * $transaction([...]) triggers a dynamic import inside Jest's VM sandbox
 * which requires --experimental-vm-modules and therefore is avoided here.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}
