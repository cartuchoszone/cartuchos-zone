'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site';
import {
  getAllCatalogGames,
  getSidebarData,
  getUniqueGenres,
  getUniqueYears,
  translateGenre,
} from '@/lib/catalog';
import {
  deleteCustomGame,
  getCustomGames,
  getFavoriteIds,
  toggleFavoriteId,
} from '@/lib/storage';
import type { Game } from '@/types/game';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import CartridgeCard from './CartridgeCard';
import CustomCartridgeModal from './CustomCartridgeModal';
import Footer from './Footer';

export default function CatalogExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const initialGenre = searchParams.get('genre') || '';
  const initialYear = searchParams.get('year') || '';
  const initialHack = (searchParams.get('hack') as 'all' | 'hack' | 'official') || 'all';
  const initialSeries = searchParams.get('series') || '';
  const initialQuery = searchParams.get('q') || '';

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [selectedHack, setSelectedHack] = useState<'all' | 'hack' | 'official'>(initialHack);
  const [selectedSeries, setSelectedSeries] = useState<string>(initialSeries);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [customGames, setCustomGames] = useState<Game[]>([]);

  const baseGames = useMemo(() => getAllCatalogGames(), []);
  const sidebarData = useMemo(() => getSidebarData(), []);

  useEffect(() => {
    setFavoriteIds(getFavoriteIds());
    setCustomGames(getCustomGames());

    const onFavUpdate = () => setFavoriteIds(getFavoriteIds());
    const onCustomUpdate = () => setCustomGames(getCustomGames());
    window.addEventListener('cartuchos:favorites-updated', onFavUpdate);
    window.addEventListener('cartuchos:custom-games-updated', onCustomUpdate);
    return () => {
      window.removeEventListener('cartuchos:favorites-updated', onFavUpdate);
      window.removeEventListener('cartuchos:custom-games-updated', onCustomUpdate);
    };
  }, []);

  // Sync URL query params when ?page= changes externally
  useEffect(() => {
    const p = Math.max(1, Number(searchParams.get('page') || '1') || 1);
    setCurrentPage(p);
  }, [searchParams]);

  const allGames = useMemo(() => {
    return [...customGames, ...baseGames];
  }, [customGames, baseGames]);

  const genresList = useMemo(() => getUniqueGenres(allGames), [allGames]);
  const yearsList = useMemo(() => getUniqueYears(allGames), [allGames]);

  const filteredGames = useMemo(() => {
    return allGames.filter((game) => {
      if (favoritesOnly && !favoriteIds.includes(game.id)) {
        return false;
      }
      if (selectedGenre && game.genre !== selectedGenre) {
        return false;
      }
      if (selectedYear && String(game.year) !== selectedYear) {
        return false;
      }
      if (selectedHack === 'hack' && !game.isHack) {
        return false;
      }
      if (selectedHack === 'official' && game.isHack) {
        return false;
      }
      if (
        selectedSeries &&
        game.series?.toLowerCase() !== selectedSeries.toLowerCase() &&
        game.enSeries?.toLowerCase() !== selectedSeries.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = game.title.toLowerCase().includes(q);
        const matchGenre =
          game.genre.toLowerCase().includes(q) ||
          translateGenre(game.genre).toLowerCase().includes(q);
        const matchSeries =
          (game.series && game.series.toLowerCase().includes(q)) ||
          (game.enSeries && game.enSeries.toLowerCase().includes(q));
        const matchDesc = game.description.toLowerCase().includes(q);
        const matchYear = String(game.year).includes(q);
        if (!matchTitle && !matchGenre && !matchSeries && !matchDesc && !matchYear) {
          return false;
        }
      }
      return true;
    });
  }, [
    allGames,
    favoritesOnly,
    favoriteIds,
    selectedGenre,
    selectedYear,
    selectedHack,
    selectedSeries,
    searchQuery,
  ]);

  const gamesPerPage = SITE_CONFIG.gamesPerPage;
  const totalPages = Math.max(1, Math.ceil(filteredGames.length / gamesPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedGames = useMemo(() => {
    const start = (safePage - 1) * gamesPerPage;
    return filteredGames.slice(start, start + gamesPerPage);
  }, [filteredGames, safePage, gamesPerPage]);

  const updatePage = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    const params = new URLSearchParams(searchParams.toString());
    if (clamped === 1) {
      params.delete('page');
    } else {
      params.set('page', String(clamped));
    }
    const qs = params.toString();
    router.push(`/pt/snes-games${qs ? `?${qs}` : ''}`, { scroll: true });
  };

  const resetAllFilters = () => {
    setSelectedGenre('');
    setSelectedYear('');
    setSelectedHack('all');
    setSelectedSeries('');
    setSearchQuery('');
    setFavoritesOnly(false);
    setCurrentPage(1);
    router.push('/pt/snes-games');
  };

  const handleToggleFavorite = (gameId: string) => {
    const res = toggleFavoriteId(gameId);
    setFavoriteIds(res.favorites);
  };

  const handleDeleteCustom = (gameId: string) => {
    const updated = deleteCustomGame(gameId);
    setCustomGames(updated);
  };

  const hasActiveFilters =
    Boolean(selectedGenre) ||
    Boolean(selectedYear) ||
    selectedHack !== 'all' ||
    Boolean(selectedSeries) ||
    Boolean(searchQuery.trim()) ||
    favoritesOnly;

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0d17] text-gray-100">
      {/* Top Navbar */}
      <Navbar
        favoriteCount={favoriteIds.length}
        showingFavoritesOnly={favoritesOnly}
        onToggleFavoritesFilter={() => {
          setFavoritesOnly((v) => !v);
          setCurrentPage(1);
        }}
        onQuickFilter={({ genre, year, hack, series, search }) => {
          if (genre !== undefined) setSelectedGenre(genre);
          if (year !== undefined) setSelectedYear(year);
          if (hack !== undefined) setSelectedHack(hack);
          if (series !== undefined) setSelectedSeries(series);
          if (search !== undefined) setSearchQuery(search);
          setFavoritesOnly(false);
          setCurrentPage(1);
        }}
      />

      {/* Collapsible Left Sidebar */}
      <Sidebar
        sidebar={sidebarData}
        activeGenre={selectedGenre}
        activeSeries={selectedSeries}
        activeSearch={searchQuery}
        onSelectGenre={(enGenre) => {
          setSelectedGenre(enGenre);
          setCurrentPage(1);
        }}
        onSelectSeries={(seriesName) => {
          setSelectedSeries(seriesName);
          setCurrentPage(1);
        }}
        onSelectTagOrPlatform={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb & Game Count Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 font-silkscreen text-xs sm:text-sm">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-gray-400">
            <Link
              href="/pt/snes-games"
              onClick={resetAllFilters}
              className="hover:text-amber-400 transition-colors"
            >
              INÍCIO
            </Link>
            <span>&gt;</span>
            <span className="text-amber-400 font-bold">SUPER NINTENDO JOGOS</span>
            {safePage > 1 && (
              <>
                <span>&gt;</span>
                <span className="text-gray-300">PÁG. {safePage}</span>
              </>
            )}
          </nav>

          <div className="bg-[#1e1b2d] border-2 border-black px-3 py-1.5 rounded-lg retro-shadow-sm inline-flex items-center gap-2 font-pixel text-[9px] sm:text-[10px]">
            <span className="text-purple-300">CATÁLOGO:</span>
            <span className="text-amber-400 font-bold">{paginatedGames.length}</span>
            <span className="text-gray-400">DE</span>
            <span className="text-white font-bold">{filteredGames.length}</span>
            {filteredGames.length !== allGames.length && (
              <span className="text-gray-500 text-[8px]">({allGames.length} TOTAL)</span>
            )}
          </div>
        </div>

        {/* Filter & Search Bar with 16-Bit Arcade Aesthetics */}
        <section className="bg-[#211d33] border-3 sm:border-4 border-black rounded-2xl p-4 sm:p-5 retro-shadow mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
            {/* Genre Select */}
            <div className="lg:col-span-3">
              <label
                htmlFor="platform-filter-genre"
                className="block font-pixel text-[9px] text-purple-300 mb-1.5"
              >
                GÊNERO:
              </label>
              <select
                id="platform-filter-genre"
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#12101c] border-2 border-black font-silkscreen text-xs text-white focus:outline-none focus:border-amber-400 shadow-[inset_2px_2px_0_#000]"
              >
                <option value="">TODOS OS GÊNEROS ({allGames.length})</option>
                {genresList.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label.toUpperCase()} ({g.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Year Select */}
            <div className="lg:col-span-2">
              <label
                htmlFor="platform-filter-year"
                className="block font-pixel text-[9px] text-purple-300 mb-1.5"
              >
                ANO:
              </label>
              <select
                id="platform-filter-year"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#12101c] border-2 border-black font-silkscreen text-xs text-white focus:outline-none focus:border-amber-400 shadow-[inset_2px_2px_0_#000]"
              >
                <option value="">TODOS OS ANOS</option>
                {yearsList.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* ROM Hack Select */}
            <div className="lg:col-span-2">
              <label
                htmlFor="platform-filter-hack"
                className="block font-pixel text-[9px] text-purple-300 mb-1.5"
              >
                ROM HACK:
              </label>
              <select
                id="platform-filter-hack"
                value={selectedHack}
                onChange={(e) => {
                  setSelectedHack(e.target.value as 'all' | 'hack' | 'official');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#12101c] border-2 border-black font-silkscreen text-xs text-white focus:outline-none focus:border-amber-400 shadow-[inset_2px_2px_0_#000]"
              >
                <option value="all">TODOS</option>
                <option value="hack">APENAS ROM HACKS</option>
                <option value="official">APENAS OFICIAIS</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="lg:col-span-3">
              <label
                htmlFor="platform-search-input"
                className="block font-pixel text-[9px] text-purple-300 mb-1.5"
              >
                PESQUISAR CARTUCHO:
              </label>
              <div className="relative">
                <input
                  id="platform-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="DIGITE O NOME DO JOGO..."
                  className="w-full pl-8 pr-7 py-2 rounded-lg bg-[#12101c] border-2 border-black font-silkscreen text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 shadow-[inset_2px_2px_0_#000]"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">
                  🔍
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white font-pixel text-[9px]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Reset Filters Button */}
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="retro-btn w-full py-2 px-3 rounded-lg bg-[#312c47] hover:bg-amber-400 hover:text-black border-2 border-black text-amber-300 font-pixel text-[9px] retro-shadow-sm transition-all"
              >
                REDEFINIR
              </button>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t-2 border-black/40 font-silkscreen text-xs">
              <span className="font-pixel text-[9px] text-gray-400">FILTROS:</span>
              {favoritesOnly && (
                <button
                  type="button"
                  onClick={() => setFavoritesOnly(false)}
                  className="retro-btn px-2.5 py-1 rounded-md bg-rose-600 border-2 border-black text-white text-[10px] flex items-center gap-1 retro-shadow-sm"
                >
                  <span>❤️ FAVORITOS</span>
                  <span>✕</span>
                </button>
              )}
              {selectedGenre && (
                <button
                  type="button"
                  onClick={() => setSelectedGenre('')}
                  className="retro-btn px-2.5 py-1 rounded-md bg-purple-700 border-2 border-black text-purple-100 text-[10px] flex items-center gap-1 retro-shadow-sm"
                >
                  <span>GÊNERO: {translateGenre(selectedGenre).toUpperCase()}</span>
                  <span>✕</span>
                </button>
              )}
              {selectedYear && (
                <button
                  type="button"
                  onClick={() => setSelectedYear('')}
                  className="retro-btn px-2.5 py-1 rounded-md bg-purple-700 border-2 border-black text-purple-100 text-[10px] flex items-center gap-1 retro-shadow-sm"
                >
                  <span>ANO: {selectedYear}</span>
                  <span>✕</span>
                </button>
              )}
              {selectedHack !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedHack('all')}
                  className="retro-btn px-2.5 py-1 rounded-md bg-amber-500 border-2 border-black text-gray-950 font-bold text-[10px] flex items-center gap-1 retro-shadow-sm"
                >
                  <span>{selectedHack === 'hack' ? 'ROM HACKS' : 'OFICIAIS'}</span>
                  <span>✕</span>
                </button>
              )}
              {selectedSeries && (
                <button
                  type="button"
                  onClick={() => setSelectedSeries('')}
                  className="retro-btn px-2.5 py-1 rounded-md bg-amber-500 border-2 border-black text-gray-950 font-bold text-[10px] flex items-center gap-1 retro-shadow-sm"
                >
                  <span>SÉRIE: {selectedSeries.toUpperCase()}</span>
                  <span>✕</span>
                </button>
              )}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="retro-btn px-2.5 py-1 rounded-md bg-purple-700 border-2 border-black text-purple-100 text-[10px] flex items-center gap-1 retro-shadow-sm"
                >
                  <span>&ldquo;{searchQuery}&rdquo;</span>
                  <span>✕</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* 6-Column Game Cartridge Grid */}
        {paginatedGames.length === 0 ? (
          <div className="bg-[#181526] border border-purple-500/25 rounded-2xl p-12 text-center space-y-4">
            <div className="text-5xl">👾</div>
            <h2 className="text-lg font-bold text-white">
              Nenhum cartucho encontrado com esses filtros
            </h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Tente limpar os filtros ou adicione seu próprio cartucho personalizado (.sfc / .smc / .zip) clicando no botão do topo.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 rounded-xl bg-amber-400 text-gray-950 font-extrabold text-xs"
              >
                Redefinir Todos os Filtros
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-5">
            {paginatedGames.map((game) => (
              <CartridgeCard
                key={game.id}
                game={game}
                isFavorite={favoriteIds.includes(game.id)}
                onToggleFavorite={handleToggleFavorite}
                onFilterByGenre={(g) => {
                  setSelectedGenre(g);
                  setCurrentPage(1);
                }}
                onFilterByYear={(y) => {
                  setSelectedYear(y);
                  setCurrentPage(1);
                }}
                onFilterBySeries={(s) => {
                  setSelectedSeries(s);
                  setCurrentPage(1);
                }}
                onDeleteCustom={game.isCustom ? handleDeleteCustom : undefined}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls (Anterior | 2 / 19 | Próximo + Direct Page Buttons) */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 font-pixel">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => updatePage(safePage - 1)}
                className="retro-btn px-3 py-2 rounded-lg bg-[#272338] hover:bg-purple-600 disabled:opacity-30 disabled:pointer-events-none border-2 border-black text-[9px] text-gray-200 retro-shadow-sm transition-all"
              >
                ◀ ANTERIOR
              </button>

              <span className="px-3 py-2 rounded-lg bg-[#141120] border-2 border-amber-400 text-amber-300 font-bold text-[10px] retro-shadow-sm">
                {safePage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => updatePage(safePage + 1)}
                className="retro-btn px-3 py-2 rounded-lg bg-[#272338] hover:bg-purple-600 disabled:opacity-30 disabled:pointer-events-none border-2 border-black text-[9px] text-gray-200 retro-shadow-sm transition-all"
              >
                PRÓXIMO ▶
              </button>
            </div>

            {/* Numbered Quick-Jump Page Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 font-pixel">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - safePage) <= 2
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && (
                        <span className="px-1 text-gray-500 font-pixel text-[9px]">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => updatePage(p)}
                        className={`retro-btn w-8 h-8 rounded-lg text-[9px] border-2 border-black transition-all ${
                          p === safePage
                            ? 'bg-amber-400 text-gray-950 font-bold retro-shadow-sm'
                            : 'bg-[#211d33] text-gray-300 hover:bg-[#342e4d]'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
