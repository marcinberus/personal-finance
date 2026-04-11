import { PrismaService } from '../../../src/prisma/prisma.service';

/**
 * Deletes all rows from reporting projection tables in appropriate order.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.categorySpendProjection.deleteMany();
  await prisma.monthlyReportProjection.deleteMany();
}
