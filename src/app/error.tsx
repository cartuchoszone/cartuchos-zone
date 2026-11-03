'use client';

import React from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0f0d17] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="text-4xl">🕹️</div>
      <h2 className="text-xl font-extrabold text-amber-400">
        Ocorreu um erro ao carregar o cartucho
      </h2>
      <p className="text-xs text-gray-400 max-w-md">
        {error?.message || 'Tente recarregar a página.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-5 py-2.5 rounded-xl bg-amber-400 text-gray-950 font-extrabold text-xs"
      >
        Recarregar Página
      </button>
    </div>
  );
}
