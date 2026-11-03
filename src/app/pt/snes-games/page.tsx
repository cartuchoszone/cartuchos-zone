import React, { Suspense } from 'react';
import CatalogExplorer from '@/components/CatalogExplorer';

export default function SnesGamesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f0d17] flex items-center justify-center text-amber-400 font-bold">
          Carregando catálogo Super Nintendo...
        </div>
      }
    >
      <CatalogExplorer />
    </Suspense>
  );
}
