// Screenshot import: decodes a base64 betslip image and hands it to the AI parser.
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, isValidSession } from '@/lib/adminAuth';
import { parseSlipImage } from '@/lib/slipParser';

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.+)$/;

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set — screenshot import is unavailable.' },
      { status: 500 }
    );
  }

  const { image } = await req.json().catch(() => ({})) as { image?: string };
  const match = image ? DATA_URL_RE.exec(image) : null;

  if (!match) {
    return NextResponse.json({ error: 'Expected a base64 image data URL' }, { status: 400 });
  }

  const [, mediaType, base64Data] = match;

  try {
    const result = await parseSlipImage(mediaType === 'image/jpg' ? 'image/jpeg' : mediaType, base64Data);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to read screenshot' }, { status: 500 });
  }
}
