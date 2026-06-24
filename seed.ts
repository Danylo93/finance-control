import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

const COGNITO_USER_POOL_ID = 'us-east-1_Mbq0IL2ae';
const USERNAME = 'danylo';
const EMAIL = 'danylo@email.com';
const PASSWORD = '123456';

async function main() {
  console.log('🌱 Iniciando o Seed...');

  // 1. Criar usuário no Cognito via AWS CLI
  console.log(`👤 Criando usuário no Cognito: ${EMAIL}...`);
  try {
    const createCmd = `aws cognito-idp admin-create-user --user-pool-id ${COGNITO_USER_POOL_ID} --username ${USERNAME} --user-attributes Name=email,Value=${EMAIL} Name=email_verified,Value=true --message-action SUPPRESS`;
    const result = execSync(createCmd, { encoding: 'utf-8' });
    const userJson = JSON.parse(result);
    
    // Setando senha permanente
    console.log('🔑 Configurando senha permanente...');
    execSync(`aws cognito-idp admin-set-user-password --user-pool-id ${COGNITO_USER_POOL_ID} --username ${USERNAME} --password ${PASSWORD} --permanent`);
    
    // Obter o UUID do Cognito (sub)
    const subAttribute = userJson.User.Attributes.find((attr: any) => attr.Name === 'sub');
    const userId = subAttribute.Value;

    console.log(`✅ Usuário criado com sucesso. ID: ${userId}`);

    // 2. Inserir dados no banco
    console.log('💾 Populando banco de dados com suas finanças...');

    // Assegurar que o User existe no Prisma (pode ser útil dependendo da regra de negócio)
    await prisma.user.upsert({
      where: { email: EMAIL },
      update: { id: userId },
      create: { id: userId, email: EMAIL },
    });

    // Criar Meta da FIV
    await prisma.goal.create({
      data: {
        userId,
        name: 'Projeto FIV 🍼',
        targetAmount: 25000,
        currentAmount: 0,
        deadline: new Date('2026-11-30T23:59:59.000Z'), // Meta: Novembro 2026
      }
    });

    // Inserir Transações Iniciais (Receitas)
    const transactions = [
      { userId, amount: 15000, description: 'Salário Dan', type: 'income', date: new Date() },
      { userId, amount: 2090, description: 'Salário Patty', type: 'income', date: new Date() },
      { userId, amount: 2097, description: 'VR/VA', type: 'income', date: new Date() },
      
      // Gastos Fixos
      { userId, amount: 4158, description: 'IRPF/INSS', type: 'expense', category: 'fixed_expenses', date: new Date() },
      { userId, amount: 1756, description: 'Financiamento Kwid', type: 'expense', category: 'fixed_expenses', date: new Date() },
      { userId, amount: 1700, description: 'Dízimo', type: 'expense', category: 'tithe', date: new Date() },
      { userId, amount: 700, description: 'Mercado (via VR)', type: 'expense', category: 'variable_expenses', date: new Date() },
      { userId, amount: 500, description: 'Pós-graduação Dan', type: 'expense', category: 'fixed_expenses', date: new Date() },
      { userId, amount: 500, description: 'Faculdade Patty', type: 'expense', category: 'fixed_expenses', date: new Date() },
      { userId, amount: 390, description: 'Água e Luz', type: 'expense', category: 'fixed_expenses', date: new Date() },
      { userId, amount: 355, description: 'Plano de Saúde Dan', type: 'expense', category: 'fixed_expenses', date: new Date() },
      { userId, amount: 355, description: 'Plano de Saúde Patty', type: 'expense', category: 'fixed_expenses', date: new Date() },
      { userId, amount: 250, description: 'Seguro Veicular', type: 'expense', category: 'fixed_expenses', date: new Date() },
      { userId, amount: 140, description: 'Academia', type: 'expense', category: 'variable_expenses', date: new Date() },
    ];

    await prisma.transaction.createMany({
      data: transactions
    });

    console.log('✅ Dados inseridos com sucesso no PostgreSQL (RDS)!');

  } catch (error: any) {
    console.error('❌ Erro durante o seed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
