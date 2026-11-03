'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#0f0d17] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-extrabold text-amber-400">
          Reiniciando Console...
        </h2>
        <p className="text-xs text-gray-400 max-w-md">
          {error?.message || 'Erro temporário de carregamento.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-amber-400 text-gray-950 font-extrabold text-xs"
        >
          Tentar Novamente
        </button>
      </body>
    </html>
  );
}
