import React from 'react';
import type { Metadata } from 'next';
import { getGameById, resolveCoverUrl } from '@/lib/catalog';
import CleanGameRoom from '@/components/CleanGameRoom';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const game = getGameById(decodedId);

  const title = game ? `Jogar ${game.title} (SNES Online)` : 'Jogar Super Nintendo';
  const description = game
    ? `Jogue ${game.title} (${game.year}) online no emulador de Super Nintendo 16-Bit com controles no celular ou PC!`
    : 'Jogue cartuchos clássicos de Super Nintendo online no navegador.';
  const coverUrl = game
    ? resolveCoverUrl(game.imageUrl)
    : 'https://cartuchoszone.netlify.app/images/logo-transparent.png';

  return {
    title: `${title} | CARTUCHOS ZONE`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://cartuchoszone.netlify.app/pt/play/${decodedId}`,
      images: [
        {
          url: coverUrl,
          width: 500,
          height: 500,
          alt: game?.title || 'Cartuchos Zone',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverUrl],
    },
  };
}

export default async function PtCleanPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const game = getGameById(decodedId);

  return <CleanGameRoom game={game} gameId={decodedId} />;
}
