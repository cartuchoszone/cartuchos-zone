import React from 'react';
import type { Metadata } from 'next';
import { getAllCatalogGames, getGameById, getRelatedGames, resolveCoverUrl } from '@/lib/catalog';
import GameDetailClient from '@/components/GameDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const game = getGameById(decodedId);

  const title = game ? `${game.title} (Super Nintendo)` : 'Jogo Super Nintendo';
  const description = game
    ? `${game.title} (${game.year}, ${game.genre}): ${game.description}`
    : 'Explore cartuchos clássicos do Super Nintendo online.';
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
      url: `https://cartuchoszone.netlify.app/pt/games/${decodedId}`,
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

export default async function PtGameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const game = getGameById(decodedId);
  const relatedGames = game
    ? getRelatedGames(game, 6)
    : getAllCatalogGames().slice(0, 6);

  return (
    <GameDetailClient
      game={game}
      gameId={decodedId}
      relatedGames={relatedGames}
    />
  );
}
