'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Game, ReviewItem } from '@/types/game';
import {
  DEFAULT_SNES_CONTROLS,
  getLongDescription,
  getSidebarData,
  inferDeveloper,
  resolveCoverUrl,
  translateGenre,
  translatePlatformName,
} from '@/lib/catalog';
import {
  addGameReview,
  getCustomGames,
  getFavoriteIds,
  getGameLikeState,
  getGameReviews,
  toggleFavoriteId,
  toggleGameLike,
} from '@/lib/storage';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import EmulatorPlayer from './EmulatorPlayer';
import CartridgeCard from './CartridgeCard';
import CustomCartridgeModal from './CustomCartridgeModal';
import Footer from './Footer';

interface GameDetailClientProps {
  game?: Game;
  gameId: string;
  relatedGames: Game[];
}

export default function GameDetailClient({
  game: initialGame,
  gameId,
  relatedGames,
}: GameDetailClientProps) {
  const router = useRouter();
  const sidebarData = getSidebarData();

  const [resolvedGame, setResolvedGame] = useState<Game | undefined>(initialGame);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  useEffect(() => {
    if (!initialGame) {
      const custom = getCustomGames().find((g) => g.id === gameId);
      if (custom) setResolvedGame(custom);
    } else {
      setResolvedGame(initialGame);
    }
  }, [initialGame, gameId]);

  const game: Game = resolvedGame || {
    id: gameId,
    title: gameId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    platform: 'SNES',
    genre: 'Action',
    year: 1994,
    description: 'Cartucho Super Nintendo pronto para jogar no emulador embutido.',
    imageUrl: 'https://classicgamezone.com/games/covers/snes/super-metroid.jpg',
  };

  // Deterministic base counts from game id so every game has realistic ClassicGameZone counters
  const seed = game.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const baseLikes = 24 + (seed % 95);
  const baseFavorites = 80 + (seed % 260);

  useEffect(() => {
    setFavoriteIds(getFavoriteIds());
  }, [game.id]);

  const isFavorite = favoriteIds.includes(game.id);
  const developer = inferDeveloper(game);
  const longParagraphs = getLongDescription(game);
  const controlsMap = game.controls || DEFAULT_SNES_CONTROLS;

  const handleToggleFav = (id: string) => {
    const res = toggleFavoriteId(id);
    setFavoriteIds(res.favorites);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0d17] text-gray-100">
      <Navbar
        favoriteCount={favoriteIds.length}
        showingFavoritesOnly={false}
        onToggleFavoritesFilter={() => router.push('/pt/snes-games')}
        onQuickFilter={({ genre, year, hack, series, search }) => {
          const params = new URLSearchParams();
          if (genre) params.set('genre', genre);
          if (year) params.set('year', year);
          if (hack && hack !== 'all') params.set('hack', hack);
          if (series) params.set('series', series);
          if (search) params.set('q', search);
          router.push(`/pt/snes-games?${params.toString()}`);
        }}
      />

      <Sidebar
        sidebar={sidebarData}
        activeGenre={game.genre}
        activeSeries={game.series || ''}
        activeSearch=""
        onSelectGenre={(g) => router.push(`/pt/snes-games?genre=${encodeURIComponent(g)}`)}
        onSelectSeries={(s) => router.push(`/pt/snes-games?series=${encodeURIComponent(s)}`)}
        onSelectTagOrPlatform={(q) => router.push(`/pt/snes-games?q=${encodeURIComponent(q)}`)}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-silkscreen text-xs sm:text-sm text-gray-400">
          <Link href="/pt/snes-games" className="hover:text-amber-400 transition-colors">
            INÍCIO
          </Link>
          <span>&gt;</span>
          <Link href="/pt/snes-games" className="hover:text-amber-400 transition-colors">
            SUPER NINTENDO JOGOS
          </Link>
          <span>&gt;</span>
          <span className="text-amber-400 font-bold">{game.title.toUpperCase()}</span>
        </nav>

        {/* Game Overview Card (16-Bit Super Nintendo Physical Cartridge Style) */}
        <section className="bg-[#211d33] border-3 sm:border-4 border-black rounded-2xl p-5 sm:p-8 retro-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Cover Artwork + Action Buttons */}
            <div className="lg:col-span-4 flex flex-col items-center sm:items-start gap-4">
              <div className="w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden border-3 border-black snes-bevel-inset shadow-2xl bg-black relative">
                <img
                  src={resolveCoverUrl(game.imageUrl)}
                  alt={game.title}
                  className="w-full h-full object-cover"
                />
                {game.isHack && (
                  <span className="absolute top-3 left-3 bg-amber-400 text-gray-950 font-pixel text-[9px] px-2 py-1 rounded border border-black shadow">
                    ROM HACK
                  </span>
                )}
              </div>

              {/* Primary Jogar Button -> 16-Bit Big Arcade Button */}
              <Link
                href={`/pt/play/${encodeURIComponent(game.id)}`}
                className="retro-btn w-full max-w-[300px] py-3.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-pixel text-xs border-2 border-black retro-shadow flex items-center justify-center gap-2 transition-all"
              >
                <span>▶</span>
                <span>JOGAR CARTUCHO</span>
              </Link>
            </div>

            {/* Right Metadata & Description */}
            <div className="lg:col-span-8 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-purple-900/80 border-2 border-black text-purple-200 font-pixel text-[8px] retro-shadow-sm">
                    {translatePlatformName(game.platform)}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-400 border-2 border-black text-gray-950 font-pixel text-[8px] font-bold retro-shadow-sm">
                    {translateGenre(game.genre).toUpperCase()}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-black/60 border-2 border-black text-gray-300 font-pixel text-[8px] retro-shadow-sm">
                    {game.year}
                  </span>
                </div>

                <h1 className="font-pixel text-xl sm:text-3xl text-white tracking-tight leading-snug drop-shadow-[2px_2px_0_#000]">
                  {game.title}
                </h1>
              </div>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-silkscreen">
                {game.description}
              </p>

              {/* 6-Item Metadata Grid (Emulador, Ano, Gênero, Desenvolvedor, Séries de Jogos, Idioma) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#151222] border-2 border-black rounded-xl p-3 shadow-[inset_2px_2px_0_#000]">
                  <div className="font-pixel text-[8px] text-purple-300">EMULADOR</div>
                  <Link
                    href="/pt/snes-games"
                    className="font-silkscreen text-xs font-bold text-amber-400 hover:underline mt-1 block truncate"
                  >
                    Super Nintendo (SNES)
                  </Link>
                </div>

                <div className="bg-[#151222] border-2 border-black rounded-xl p-3 shadow-[inset_2px_2px_0_#000]">
                  <div className="font-pixel text-[8px] text-purple-300">ANO</div>
                  <Link
                    href={`/pt/snes-games?year=${game.year}`}
                    className="font-silkscreen text-xs font-bold text-white hover:text-amber-400 mt-1 block truncate"
                  >
                    {game.year}
                  </Link>
                </div>

                <div className="bg-[#151222] border-2 border-black rounded-xl p-3 shadow-[inset_2px_2px_0_#000]">
                  <div className="font-pixel text-[8px] text-purple-300">GÊNERO</div>
                  <Link
                    href={`/pt/snes-games?genre=${encodeURIComponent(game.genre)}`}
                    className="font-silkscreen text-xs font-bold text-amber-400 hover:underline mt-1 block truncate"
                  >
                    {translateGenre(game.genre)}
                  </Link>
                </div>

                <div className="bg-[#151222] border-2 border-black rounded-xl p-3 shadow-[inset_2px_2px_0_#000]">
                  <div className="font-pixel text-[8px] text-purple-300">
                    DESENVOLVEDOR
                  </div>
                  <div className="font-silkscreen text-xs font-bold text-gray-200 mt-1 truncate">
                    {developer}
                  </div>
                </div>

                <div className="bg-[#151222] border-2 border-black rounded-xl p-3 shadow-[inset_2px_2px_0_#000]">
                  <div className="font-pixel text-[8px] text-purple-300">
                    SÉRIES DE JOGOS
                  </div>
                  {game.series ? (
                    <Link
                      href={`/pt/snes-games?series=${encodeURIComponent(game.series)}`}
                      className="font-silkscreen text-xs font-bold text-amber-400 hover:underline mt-1 block truncate"
                    >
                      {game.series}
                    </Link>
                  ) : (
                    <div className="font-silkscreen text-xs font-bold text-gray-400 mt-1 truncate">
                      Independente
                    </div>
                  )}
                </div>

                <div className="bg-[#151222] border-2 border-black rounded-xl p-3 shadow-[inset_2px_2px_0_#000]">
                  <div className="font-pixel text-[8px] text-purple-300">IDIOMA</div>
                  <div className="font-silkscreen text-xs font-bold text-gray-200 mt-1 truncate">
                    Inglês / Português
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Controls Mapping */}
        <section className="w-full bg-[#211d33] border-3 sm:border-4 border-black rounded-2xl p-6 sm:p-7 retro-shadow">
          <h2 className="font-pixel text-sm sm:text-base text-amber-400 mb-5 flex items-center gap-2">
            <span>🎮</span>
            <span>CONTROLES DO SUPER NINTENDO</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs sm:text-sm">
            {Object.entries(controlsMap).map(([keyName, actionDesc]) => (
              <div key={keyName} className="py-2.5 px-3.5 rounded-lg bg-[#141120] border-2 border-black flex items-center justify-between gap-4 shadow-[inset_2px_2px_0_#000]">
                <span className="px-2.5 py-1 rounded bg-[#2a263d] border-2 border-black font-pixel text-[9px] text-amber-300 shadow-sm">
                  {keyName}
                </span>
                <span className="text-gray-300 text-right font-silkscreen text-xs">{actionDesc}</span>
              </div>
            ))}
          </div>
          <p className="font-silkscreen text-xs text-gray-300 mt-5 bg-[#141120] border-2 border-black rounded-xl p-3.5 flex items-start gap-2 shadow-[inset_2px_2px_0_#000]">
            <span className="text-base leading-none">💡</span>
            <span>
              <strong>Dica:</strong> No celular os botões aparecem diretamente na tela ao clicar em <strong>JOGAR CARTUCHO</strong>! Você também pode conectar qualquer controle USB ou Bluetooth.
            </span>
          </p>
        </section>

        {/* Jogos Relacionados */}
        {relatedGames.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-pixel text-sm sm:text-base text-white flex items-center gap-2">
              <span>🔥</span>
              <span>JOGOS RELACIONADOS</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-5">
              {relatedGames.map((rel) => (
                <CartridgeCard
                  key={rel.id}
                  game={rel}
                  isFavorite={favoriteIds.includes(rel.id)}
                  onToggleFavorite={handleToggleFav}
                  onFilterByGenre={(g) =>
                    router.push(`/pt/snes-games?genre=${encodeURIComponent(g)}`)
                  }
                  onFilterByYear={(y) =>
                    router.push(`/pt/snes-games?year=${encodeURIComponent(y)}`)
                  }
                  onFilterBySeries={(s) =>
                    router.push(`/pt/snes-games?series=${encodeURIComponent(s)}`)
                  }
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
