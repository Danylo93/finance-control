import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      const goals = await prisma.goal.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(goals);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const goal = await prisma.goal.create({
        data: {
          ...data,
          userId: data.userId,
        },
      });
      return res.status(201).json(goal);
    }

    if (req.method === 'PUT') {
      const { id, currentAmount } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      
      const goal = await prisma.goal.update({
        where: { id },
        data: { currentAmount },
      });
      return res.status(200).json(goal);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      
      await prisma.goal.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
