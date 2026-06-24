import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'danylo@email.com';

async function main() {
  console.log('🔄 Iniciando migração das transações para VA/VR...');

  const user = await prisma.user.findUnique({
    where: { email: EMAIL }
  });

  if (!user) {
    console.error('Usuário não encontrado!');
    return;
  }

  // Pegar a receita de VR/VA
  const benefitsIncome = await prisma.transaction.findFirst({
    where: {
      userId: user.id,
      description: 'VR/VA',
      type: 'income',
    }
  });

  if (benefitsIncome) {
    await prisma.transaction.update({
      where: { id: benefitsIncome.id },
      data: { account: 'benefits' }
    });
    console.log(`✅ Atualizada receita de VR/VA para account=benefits.`);
  }

  // Pegar a despesa de Mercado
  const mercadoExpense = await prisma.transaction.findFirst({
    where: {
      userId: user.id,
      description: {
        contains: 'Mercado'
      },
      type: 'expense'
    }
  });

  if (mercadoExpense) {
    await prisma.transaction.update({
      where: { id: mercadoExpense.id },
      data: { account: 'benefits' }
    });
    console.log(`✅ Atualizada despesa de Mercado para account=benefits.`);
  }

  console.log('🎉 Migração concluída com sucesso!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
