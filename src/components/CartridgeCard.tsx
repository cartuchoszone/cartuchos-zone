'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Game } from '@/types/game';
import { resolveCoverUrl, translateGenre, translatePlatformName } from '@/lib/catalog';

interface CartridgeCardProps {
  game: Game;
  isFavorite: boolean;
  onToggleFavorite: (gameId: string) => void;
  onFilterByGenre: (genre: string) => void;
  onFilterByYear: (year: string) => void;
  onFilterBySeries: (series: string) => void;
  onDeleteCustom?: (gameId: string) => void;
}

export default function CartridgeCard({
  game,
  isFavorite,
  onToggleFavorite,
  onFilterByGenre,
  onFilterByYear,
  onFilterBySeries,
  onDeleteCustom,
}: CartridgeCardProps) {
  const [imgError, setImgError] = useState(false);
  const coverSrc = imgError
    ? 'https://classicgamezone.com/games/covers/snes/super-metroid.jpg'
    : resolveCoverUrl(game.imageUrl);

  // Generate an authentic SNES serial code like SNS-SM-USA
  const serialCode = `SNS-${game.id.slice(0, 3).toUpperCase()}-USA`;

  return (
    <div className="group relative bg-[#231f33] hover:bg-[#2b273d] border-3 sm:border-4 border-black rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1.5 retro-shadow flex flex-col select-none">
      {/* Top SNES Cartridge Shell Header (Grip ridges + Serial + Year) */}
      <div className="bg-[#1b1728] px-2.5 py-1.5 border-b-2 border-black flex items-center justify-between text-[8px] sm:text-[9px] font-pixel">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="text-purple-300 font-bold tracking-tight">
            {serialCode}
          </span>
        </div>

        {/* Cartridge plastic grip grooves */}
        <div className="flex flex-col gap-0.5 w-7 opacity-50">
          <div className="h-[1.5px] bg-purple-300 rounded-full" />
          <div className="h-[1.5px] bg-purple-300 rounded-full" />
        </div>

        <span className="text-amber-400 font-bold">{game.year}</span>
      </div>

      {/* Cartridge Label Artwork Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-black snes-bevel-inset">
        <Link href={`/pt/games/${encodeURIComponent(game.id)}`} className="block w-full h-full">
          <img
            src={coverSrc}
            alt={game.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
          {/* Subtle 16-bit CRT shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />
        </Link>

        {/* Top-left Badges (Platform & ROM Hack) */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 pointer-events-none">
          <span className="bg-black/90 text-white font-pixel text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded border border-white/20">
            {translatePlatformName(game.platform)}
          </span>
          {game.isHack && (
            <span className="bg-amber-400 text-gray-950 font-pixel text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded border border-black shadow">
              HACK
            </span>
          )}
          {game.isCustom && (
            <span className="bg-emerald-400 text-gray-950 font-pixel text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded border border-black shadow">
              MEU
            </span>
          )}
        </div>

        {/* Top-right Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(game.id);
          }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`retro-btn absolute top-2 right-2 w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center transition-all ${
            isFavorite
              ? 'bg-rose-600 text-white shadow'
              : 'bg-black/70 text-gray-300 hover:bg-black hover:text-rose-400'
          }`}
        >
          <span className="text-xs">{isFavorite ? '❤️' : '🤍'}</span>
        </button>

        {/* Hover "Jogar" Quick Action */}
        <Link
          href={`/pt/play/${encodeURIComponent(game.id)}`}
          className="retro-btn absolute bottom-2.5 right-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-150 translate-y-0 sm:translate-y-1 sm:group-hover:translate-y-0 bg-amber-400 hover:bg-amber-300 text-gray-950 font-pixel text-[9px] px-2.5 py-1.5 rounded-lg border-2 border-black retro-shadow-sm flex items-center gap-1"
        >
          <span>▶</span>
          <span>JOGAR</span>
        </Link>
      </div>

      {/* Card Body (Title, Year, Genre, Series, Description) */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/pt/games/${encodeURIComponent(game.id)}`}>
            <h2
              className="font-pixel text-[11px] sm:text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight"
              title={game.title}
            >
              {game.title}
            </h2>
          </Link>

          {/* Year & Genre Interactive Filter Tags */}
          <div className="flex items-center justify-between text-xs text-gray-400 mt-2 gap-1 font-silkscreen">
            <button
              type="button"
              onClick={() => onFilterByYear(String(game.year))}
              className="hover:text-amber-400 hover:underline transition-colors text-[11px]"
            >
              {game.year}
            </button>
            <button
              type="button"
              onClick={() => onFilterByGenre(game.genre)}
              className="bg-[#14121e] border border-purple-500/40 text-purple-200 hover:border-amber-400 hover:text-amber-300 px-2 py-0.5 rounded text-[10px] truncate max-w-[130px] transition-colors"
              title={translateGenre(game.genre)}
            >
              {translateGenre(game.genre)}
            </button>
          </div>

          {/* Series Link */}
          {game.series && (
            <div className="mt-1 font-silkscreen text-[11px] text-gray-400 truncate">
              <span>Série: </span>
              <button
                type="button"
                onClick={() => onFilterBySeries(game.series!)}
                className="text-amber-400/90 hover:text-amber-300 hover:underline font-semibold"
              >
                {game.series}
              </button>
            </div>
          )}

          {/* Description */}
          <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Delete button if custom user cartridge */}
        {game.isCustom && onDeleteCustom && (
          <button
            type="button"
            onClick={() => onDeleteCustom(game.id)}
            className="retro-btn mt-2.5 w-full py-1 font-pixel text-[8px] text-rose-300 hover:text-white bg-rose-950 border-2 border-black rounded transition-colors"
          >
            🗑️ REMOVER CARTUCHO
          </button>
        )}
      </div>
    </div>
  );
}
