'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site';

interface NavbarProps {
  favoriteCount: number;
  showingFavoritesOnly: boolean;
  onToggleFavoritesFilter: () => void;
  onOpenCustomModal?: () => void;
  onQuickFilter: (params: {
    genre?: string;
    year?: string;
    hack?: 'all' | 'hack' | 'official';
    series?: string;
    search?: string;
  }) => void;
}

export default function Navbar({
  favoriteCount,
  showingFavoritesOnly,
  onToggleFavoritesFilter,
  onOpenCustomModal,
  onQuickFilter,
}: NavbarProps) {
  const [swaySpeed, setSwaySpeed] = useState<'normal' | 'fast'>('normal');

  return (
    <header className="sticky top-0 z-40 bg-[#1a1727] border-b-4 border-black shadow-[0_6px_0_rgba(0,0,0,0.5)] text-white">
      {/* Top SNES Console Vent Stripes & Power LED */}
      <div className="h-2.5 bg-[#2a263a] border-b border-[#3b364e] flex items-center justify-between px-4 sm:px-8">
        <div className="flex gap-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-3.5 h-1 bg-[#14121d] border-b border-[#3e3954]" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-silkscreen text-[8px] sm:text-[9px] text-purple-300 tracking-wider hidden xs:inline">
            16-BIT HIGH DEFINITION SOUND
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-led inline-block" />
            <span className="font-pixel text-[7px] sm:text-[8px] text-red-400 font-bold">POWER</span>
          </div>
        </div>
      </div>

      <nav className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo with Keychain Physics Animation */}
        <div className="flex items-center gap-4">
          <Link
            href="/pt/snes-games"
            onClick={() => onQuickFilter({ genre: '', year: '', hack: 'all', series: '', search: '' })}
            onMouseEnter={() => setSwaySpeed('fast')}
            onMouseLeave={() => setSwaySpeed('normal')}
            className="flex items-center gap-3 group"
          >
            {/* The 16-Bit Keychain Logo */}
            <div className="relative py-0.5">
              <img
                src="/images/logo-transparent.png"
                alt="Cartuchos Zone Logo"
                className="h-12 sm:h-14 w-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)] select-none animate-keychain"
                style={{
                  animationDuration: swaySpeed === 'fast' ? '1.1s' : '3.5s',
                }}
              />
            </div>

            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[9px] bg-purple-900/80 text-purple-200 border-2 border-purple-500 px-1.5 py-0.5 rounded shadow-[2px_2px_0_#000]">
                  SUPER NINTENDO
                </span>
                <span className="font-pixel text-[9px] text-amber-400">
                  ★ 326 JOGOS
                </span>
              </div>
              <p className="font-silkscreen text-[10px] text-gray-400 mt-0.5">
                {SITE_CONFIG.tagline}
              </p>
            </div>
          </Link>
        </div>

        {/* Right Actions: Favorites filter & Add Cartridge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Favorites Filter Toggle */}
          <button
            type="button"
            onClick={onToggleFavoritesFilter}
            className={`retro-btn font-pixel text-[9px] sm:text-[10px] px-2.5 sm:px-3 py-1.5 rounded-lg border-2 border-black flex items-center gap-1.5 transition-all ${
              showingFavoritesOnly
                ? 'bg-rose-600 text-white retro-shadow-sm'
                : 'bg-[#272338] hover:bg-[#342f4a] text-purple-200 border-purple-500/40'
            }`}
            title="Filtrar meus favoritos"
          >
            <span>{showingFavoritesOnly ? '❤️' : '🤍'}</span>
            <span className="hidden xs:inline">FAVS</span>
            {favoriteCount > 0 && (
              <span className="bg-black/50 text-amber-300 px-1.5 py-0.2 rounded text-[9px]">
                {favoriteCount}
              </span>
            )}
          </button>

          {/* Add Custom Cartridge Button (if handler provided) */}
          {onOpenCustomModal && (
            <button
              type="button"
              onClick={onOpenCustomModal}
              className="retro-btn bg-amber-400 hover:bg-amber-300 text-gray-950 font-pixel text-[9px] sm:text-[10px] px-2.5 sm:px-3 py-1.5 rounded-lg border-2 border-black retro-shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span>+</span>
              <span className="hidden sm:inline">CRIAR CARTUCHO</span>
            </button>
          )}
        </div>
      </nav>

      {/* Bottom SNES Quad-Color Accent Stripe (Purple / Lavender / Yellow / Blue) */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#805ad5]" />
        <div className="flex-1 bg-[#b794f4]" />
        <div className="flex-1 bg-[#ecc94b]" />
        <div className="flex-1 bg-[#4299e1]" />
      </div>
    </header>
  );
}
