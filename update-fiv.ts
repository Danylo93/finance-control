import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'danylo@email.com';

async function main() {
  console.log('🔄 Atualizando dados...');

  const user = await prisma.user.findUnique({
    where: { email: EMAIL }
  });

  if (!user) {
    console.error('Usuário não encontrado!');
    return;
  }

  // Criar uma transação de exemplo para a categoria FIV
  await prisma.transaction.create({
    data: {
      userId: user.id,
      amount: 1900, // Aproximadamente 10% das receitas (R$ 19.187)
      description: 'Aporte FIV (Mensal)',
      type: 'expense',
      category: 'fiv',
      date: new Date()
    }
  });

  console.log('✅ Dados atualizados: Transação de aporte da FIV inserida com sucesso.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
