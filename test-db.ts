import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user');
      return;
    }
    const t = await prisma.transaction.create({
      data: {
        userId: user.id,
        description: 'Test',
        amount: 10,
        type: 'expense',
        category: 'variable_expenses',
        account: 'checking'
      }
    });
    console.log('Success:', t.id);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
