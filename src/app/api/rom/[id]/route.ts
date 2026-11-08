import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawId = decodeURIComponent(id || '');
  const safeId = rawId
    .replace(/\.(smc|sfc|zip)$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  // 1. Check local public/roms folder first
  const localExts = ['.smc', '.sfc', '.zip', '-snes.smc', '-snes.sfc', '-snes.zip'];
  const romsDir = path.join(process.cwd(), 'public', 'roms');
  for (const ext of localExts) {
    const filePath = path.join(romsDir, `${safeId}${ext}`);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(stat.size),
          'Content-Disposition': `inline; filename="${safeId}${ext}"`,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  // 2. Check remote ClassicGameZone
  const candidates = [
    `https://classicgamezone.com/games/roms/snes/${safeId}.smc`,
    `https://classicgamezone.com/games/roms/snes/${safeId}.sfc`,
    `https://classicgamezone.com/games/roms/snes/${safeId}.zip`,
    `https://classicgamezone.com/games/roms/snes/${safeId}-snes.smc`,
    `https://classicgamezone.com/games/roms/snes/${safeId}-snes.sfc`,
  ];

  for (const remoteUrl of candidates) {
    try {
      const res = await fetch(remoteUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Referer: 'https://classicgamezone.com/',
        },
      });

      if (res.ok) {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': res.headers.get('content-length') || '',
            'Content-Disposition': `inline; filename="${safeId}.smc"`,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch {
      // Try next
    }
  }

  return new NextResponse(null, {
    status: 404,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawId = decodeURIComponent(id || '');
  const safeId = rawId
    .replace(/\.(smc|sfc|zip)$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  // 1. Check local public/roms folder first
  const localExts = ['.smc', '.sfc', '.zip', '-snes.smc', '-snes.sfc', '-snes.zip'];
  const romsDir = path.join(process.cwd(), 'public', 'roms');
  for (const ext of localExts) {
    const filePath = path.join(romsDir, `${safeId}${ext}`);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `inline; filename="${safeId}${ext}"`,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  // 2. Fallback: proxy from classicgamezone ROM server
  const candidates = [
    `https://classicgamezone.com/games/roms/snes/${safeId}.smc`,
    `https://classicgamezone.com/games/roms/snes/${safeId}.sfc`,
    `https://classicgamezone.com/games/roms/snes/${safeId}.zip`,
    `https://classicgamezone.com/games/roms/snes/${safeId}-snes.smc`,
    `https://classicgamezone.com/games/roms/snes/${safeId}-snes.sfc`,
  ];

  const attempts: Array<{ url: string; status?: number; error?: string }> = [];

  for (const remoteUrl of candidates) {
    try {
      const res = await fetch(remoteUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Referer: 'https://classicgamezone.com/',
        },
      });

      attempts.push({ url: remoteUrl, status: res.status });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        if (!contentType.includes('text/html')) {
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `inline; filename="${safeId}.smc"`,
              'Content-Length': String(buffer.byteLength),
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      }
    } catch (err: any) {
      attempts.push({ url: remoteUrl, error: String(err?.message || err) });
    }
  }

  return NextResponse.json(
    {
      error: 'ROM indisponível no momento.',
      attempts,
    },
    {
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
