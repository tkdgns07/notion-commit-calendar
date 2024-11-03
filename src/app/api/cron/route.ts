import type { NextRequest } from 'next/server';
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  await prisma.tempCommits.deleteMany();
}
