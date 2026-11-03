import React from 'react';
import { getGameById } from '@/lib/catalog';
import CleanGameRoom from '@/components/CleanGameRoom';

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
