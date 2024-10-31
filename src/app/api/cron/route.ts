import type { NextRequest } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  try {
    const response = axios.get('/api/getgitcommit');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
