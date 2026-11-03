'use client';

import React, { useState } from 'react';
import type { SidebarData } from '@/types/game';
import { translateGenre } from '@/lib/catalog';

interface SidebarProps {
  sidebar: SidebarData;
  activeGenre: string;
  activeSeries: string;
  activeSearch: string;
  onSelectGenre: (enGenre: string) => void;
  onSelectSeries: (seriesName: string) => void;
  onSelectTagOrPlatform: (query: string) => void;
}

export default function Sidebar({
  sidebar,
  activeGenre,
  activeSeries,
  onSelectGenre,
  onSelectSeries,
  onSelectTagOrPlatform,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'platforms' | 'genres' | 'series' | 'tags'>('genres');

  return (
    <>
      {/* Backdrop on mobile when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Collapsible Left Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-[#1d192c] border-r-4 border-black shadow-[8px_0_0_rgba(0,0,0,0.5)] z-40 transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'
        }`}
      >
        {/* Floating Yellow Toggle Tab with 16-Bit Pixel Style */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
          className="fixed top-1/2 -translate-y-1/2 left-0 z-50 bg-amber-400 hover:bg-amber-300 text-gray-950 rounded-r-xl w-12 h-16 flex items-center justify-center border-y-3 border-r-3 border-black retro-shadow transition-transform duration-300 retro-btn"
          style={{
            transform: isOpen ? 'translate(320px, -50%)' : 'translate(0px, -50%)',
          }}
          title={isOpen ? 'Recolher Categorias' : 'Abrir Categorias (Emuladores, Gêneros, Séries, Tags)'}
        >
          {isOpen ? (
            <span className="font-pixel text-xs font-bold">◀</span>
          ) : (
            <div className="flex flex-col items-center leading-none gap-1">
              <span className="text-base">🕹️</span>
              <span className="font-pixel text-[8px] font-bold">MENU</span>
            </div>
          )}
        </button>

        {/* Sidebar Header */}
        <div className="p-3.5 border-b-2 border-black flex items-center justify-between bg-[#151222]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗂️</span>
            <h2 className="font-pixel text-[10px] text-amber-400">
              NAVEGAR 16-BIT
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="retro-btn text-gray-300 hover:text-white font-pixel text-[8px] px-2 py-1 rounded bg-[#272338] border border-black"
          >
            FECHAR ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-[#171424] border-b-2 border-black text-xs font-pixel">
          <button
            type="button"
            onClick={() => setExpandedSection('platforms')}
            className={`py-2 rounded font-pixel text-[8px] flex flex-col items-center gap-1 border transition-all ${
              expandedSection === 'platforms'
                ? 'bg-purple-700 border-black text-white retro-shadow-sm'
                : 'border-transparent text-gray-400 hover:bg-white/5'
            }`}
          >
            <span>🕹️</span>
            <span>CONSOLES</span>
          </button>
          <button
            type="button"
            onClick={() => setExpandedSection('genres')}
            className={`py-2 rounded font-pixel text-[8px] flex flex-col items-center gap-1 border transition-all ${
              expandedSection === 'genres'
                ? 'bg-purple-700 border-black text-white retro-shadow-sm'
                : 'border-transparent text-gray-400 hover:bg-white/5'
            }`}
          >
            <span>🎮</span>
            <span>GÊNEROS</span>
          </button>
          <button
            type="button"
            onClick={() => setExpandedSection('series')}
            className={`py-2 rounded font-pixel text-[8px] flex flex-col items-center gap-1 border transition-all ${
              expandedSection === 'series'
                ? 'bg-purple-700 border-black text-white retro-shadow-sm'
                : 'border-transparent text-gray-400 hover:bg-white/5'
            }`}
          >
            <span>🎯</span>
            <span>SÉRIES</span>
          </button>
          <button
            type="button"
            onClick={() => setExpandedSection('tags')}
            className={`py-2 rounded font-pixel text-[8px] flex flex-col items-center gap-1 border transition-all ${
              expandedSection === 'tags'
                ? 'bg-purple-700 border-black text-white retro-shadow-sm'
                : 'border-transparent text-gray-400 hover:bg-white/5'
            }`}
          >
            <span>🏷️</span>
            <span>TAGS</span>
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {expandedSection === 'platforms' && (
            <>
              <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                🕹️ Emuladores & Plataformas ({sidebar.platforms.length})
              </div>
              {sidebar.platforms.map((p) => {
                const isSnes = p.name === 'SNES';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (isSnes) {
                        onSelectTagOrPlatform('');
                      } else {
                        onSelectTagOrPlatform(p.name);
                      }
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isSnes
                        ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold'
                        : 'text-gray-300 hover:bg-purple-600/20 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.name === 'SNES' ? 'Super Nintendo (SNES)' : p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-gray-300">
                      {p.count}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {expandedSection === 'genres' && (
            <>
              <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                🎮 Filtrar por Gênero ({sidebar.genres.length})
              </div>
              {sidebar.genres.map((g) => {
                const active = activeGenre === g.name;
                return (
                  <button
                    key={g.slug || g.name}
                    type="button"
                    onClick={() => {
                      onSelectGenre(active ? '' : g.name);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold'
                        : 'text-gray-300 hover:bg-purple-600/20 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{translateGenre(g.name)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-gray-300">
                      {g.count}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {expandedSection === 'series' && (
            <>
              <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                🎯 Séries de Jogos ({sidebar.series.length})
              </div>
              {sidebar.series.map((s) => {
                const active = activeSeries === s.name || activeSeries === s.enName;
                return (
                  <button
                    key={s.enName}
                    type="button"
                    onClick={() => {
                      onSelectSeries(active ? '' : s.name);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold'
                        : 'text-gray-300 hover:bg-purple-600/20 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-gray-300">
                      {s.count}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {expandedSection === 'tags' && (
            <>
              <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                🏷️ Tags Populares ({sidebar.tags.length})
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sidebar.tags.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      onSelectTagOrPlatform(t.name);
                      setIsOpen(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#242038] hover:bg-purple-600/40 border border-purple-500/20 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
                  >
                    <span>#{t.name}</span>
                    <span className="text-[10px] text-amber-400">({t.count})</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
