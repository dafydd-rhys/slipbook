// Public health check — reports which storage backend is active and a rough bet count.
import { NextResponse } from 'next/server';
import { readBets } from '@/lib/storage';

export async function GET() {
  const usingRedis = !!(process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL);

  try {
    const data = await readBets();
    return NextResponse.json({
      storage: usingRedis ? 'upstash-redis' : 'local-json',
      connected: true,
      betCount: data.bets.length,
    });
  } catch (err) {
    return NextResponse.json({
      storage: usingRedis ? 'upstash-redis' : 'local-json',
      connected: false,
      error: String(err),
    }, { status: 500 });
  }
}
