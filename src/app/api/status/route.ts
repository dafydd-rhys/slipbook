import { NextResponse } from 'next/server';
import { readBets } from '@/lib/db';

export async function GET() {
  const usingRedis = !!process.env.UPSTASH_REDIS_REST_URL;

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
