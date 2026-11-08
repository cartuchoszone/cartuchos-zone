import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawId = decodeURIComponent(id || '');
  const safeId = rawId
    .replace(/\.(smc|sfc|zip)$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  return NextResponse.redirect(new URL(`/roms/${safeId}.smc`, req.url), 307);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawId = decodeURIComponent(id || '');
  const safeId = rawId
    .replace(/\.(smc|sfc|zip)$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  return NextResponse.redirect(new URL(`/roms/${safeId}.smc`, req.url), 307);
}
