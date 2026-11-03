'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Game } from '@/types/game';
import { resolveCoverUrl } from '@/lib/catalog';
import { addRecentId, saveRomBlobToIDB } from '@/lib/storage';

interface EmulatorPlayerProps {
  game: Game;
  autoStart?: boolean;
}

export default function EmulatorPlayer({ game }: EmulatorPlayerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLaunchCleanPage = () => {
    addRecentId(game.id);
    router.push(`/pt/play/${encodeURIComponent(game.id)}`);
  };

  const handleUploadRomAndPlay = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addRecentId(game.id);
    try {
      await saveRomBlobToIDB(game.id, file, file.name);
    } catch {
      // ignore IDB quota errors
    }
    router.push(`/pt/play/${encodeURIComponent(game.id)}`);
  };

  return (
    <div className="bg-[#161324] border border-purple-500/35 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Cartridge Slot Control Bar */}
      <div className="bg-[#1e1a30] px-4 py-3 border-b border-purple-500/25 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 font-bold text-sm">
            🕹️
          </span>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Console Dedicado Super Nintendo (Modo Tela Limpa)
            </div>
            <div className="text-[11px] text-gray-400">
              Abre em tela exclusiva sem sobrepor os controles na imagem do jogo
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".sfc,.smc,.zip,.fig,.swc"
            onChange={handleUploadRomAndPlay}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
          >
            <span>📂</span>
            <span>Inserir Minha ROM (.sfc / .smc / .zip)</span>
          </button>

          <button
            type="button"
            onClick={handleLaunchCleanPage}
            className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-xs flex items-center gap-1.5 shadow transition-colors"
          >
            <span>▶</span>
            <span>Jogar em Página Limpa</span>
          </button>
        </div>
      </div>

      {/* Preview Deck that launches Clean Game Room */}
      <div className="relative w-full py-10 px-6 bg-[#09080f] flex items-center justify-center overflow-hidden">
        <img
          src={resolveCoverUrl(game.imageUrl)}
          alt={game.title}
          className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-110 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09080f] via-[#09080f]/75 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-lg text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-2xl">
            <img
              src={resolveCoverUrl(game.imageUrl)}
              alt={game.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-600/40 border border-purple-400/40 text-purple-200 text-[11px] font-bold uppercase tracking-wider">
              Super Nintendo • {game.year}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
              {game.title}
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              Ao clicar em <strong>Jogar</strong>, o jogo abre em uma página limpa exclusiva onde a tela do jogo fica 100% visível e os controles ficam posicionados fora da imagem.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLaunchCleanPage}
              className="px-7 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-base shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-transform hover:scale-105"
            >
              <span>▶</span>
              <span>Jogar Agora</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3.5 rounded-xl bg-[#241f38] hover:bg-purple-700/50 border border-purple-400/40 text-white font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <span>📂</span>
              <span>Carregar ROM (.sfc / .smc / .zip)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

