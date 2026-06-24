import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // TODO: Validar o JWT do Cognito no Header Authorization

  try {
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      const transactions = await prisma.transaction.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { date: 'desc' },
      });
      return res.status(200).json(transactions);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const transaction = await prisma.transaction.create({
        data: {
          ...data,
          userId: data.userId || 'DUMMY_USER_ID', // Deve vir do Token Cognito
        },
      });
      return res.status(201).json(transaction);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      await prisma.transaction.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
