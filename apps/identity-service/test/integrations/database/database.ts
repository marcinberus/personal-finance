import { PrismaService } from '../../../src/prisma/prisma.service';

/**
 * Deletes all identity-service rows so each test starts with a clean database.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.user.deleteMany();
}
