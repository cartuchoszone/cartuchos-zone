import React from 'react';
import { getAllCatalogGames, getGameById, getRelatedGames } from '@/lib/catalog';
import GameDetailClient from '@/components/GameDetailClient';

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
