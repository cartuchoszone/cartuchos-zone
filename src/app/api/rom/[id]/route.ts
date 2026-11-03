import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');

  // 1. Check local public/roms folder first
  const localExts = ['.smc', '.sfc', '.zip'];
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
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  }

  // 2. Fallback: proxy from classicgamezone ROM server
  const candidates = [
    `https://classicgamezone.com/games/roms/snes/${safeId}.smc`,
    `https://classicgamezone.com/games/roms/snes/${safeId}.sfc`,
    `https://classicgamezone.com/games/roms/snes/${safeId}.zip`,
  ];

  for (const remoteUrl of candidates) {
    try {
      const res = await fetch(remoteUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Referer: 'https://classicgamezone.com/',
        },
      });

      if (res.ok && res.body) {
        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        if (!contentType.includes('text/html')) {
          const arrayBuffer = await res.arrayBuffer();
          return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `inline; filename="${safeId}.smc"`,
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      }
    } catch {
      // Try next candidate
    }
  }

  return NextResponse.json(
    {
      error:
        'ROM remota indisponível no momento. Você pode carregar seu próprio arquivo .sfc / .smc / .zip diretamente no botão "Inserir Cartucho Local (.sfc/.smc)".',
    },
    { status: 404 }
  );
}
