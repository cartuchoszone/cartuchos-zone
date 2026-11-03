'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Preview16BitPage() {
  const [scanlinesActive, setScanlinesActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'action' | 'rpg'>('all');
  const [coinCount, setCoinCount] = useState(16);
  const [swaySpeed, setSwaySpeed] = useState<'normal' | 'fast'>('normal');

  return (
    <div className={`min-h-screen bg-[#0d0b16] text-gray-100 relative ${scanlinesActive ? 'scanlines' : ''}`}>
      {/* 16-BIT TOP NAVBAR SHOWCASE */}
      <header className="sticky top-0 z-50 bg-[#1e1b2b] border-b-4 border-black shadow-[0_8px_0_rgba(0,0,0,0.4)]">
        {/* SNES Top Bevel & Vent Stripes */}
        <div className="h-2 bg-[#2d293d] border-b border-[#3b364e] flex items-center justify-between px-6">
          <div className="flex gap-1">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-4 h-1 bg-[#151320] border-b border-[#3e3954]" />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-silkscreen text-[9px] text-purple-300 tracking-wider">
              16-BIT HIGH DEFINITION SOUND
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-led inline-block" />
              <span className="font-pixel text-[8px] text-red-400">POWER</span>
            </div>
          </div>
        </div>

        {/* Main Nav Body */}
        <nav className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Logo with Keychain Animation */}
          <div className="flex items-center gap-4">
            <div
              onMouseEnter={() => setSwaySpeed('fast')}
              onMouseLeave={() => setSwaySpeed('normal')}
              className="group cursor-pointer flex items-center gap-3"
            >
              <div className="relative py-1">
                {/* Real User Logo with Keychain Physics Animation */}
                <img
                  src="/images/logo-transparent.png"
                  alt="Cartuchos Zone Logo"
                  className={`h-14 sm:h-16 w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] select-none transition-transform ${
                    swaySpeed === 'fast' ? 'animate-keychain' : 'animate-keychain'
                  }`}
                  style={{
                    animationDuration: swaySpeed === 'fast' ? '1s' : '3.5s',
                  }}
                />
              </div>

              <div className="hidden lg:flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[10px] bg-purple-900/80 text-purple-200 border-2 border-purple-500 px-2 py-0.5 rounded shadow-[2px_2px_0_#000]">
                    SUPER NINTENDO
                  </span>
                  <span className="font-pixel text-[9px] text-amber-400 animate-pulse">
                    ★ 326 JOGOS
                  </span>
                </div>
                <span className="font-silkscreen text-[11px] text-gray-400 mt-1">
                  COLEÇÃO CLÁSSICA 16-BIT EMULADA
                </span>
              </div>
            </div>
          </div>

          {/* Center Pixel Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="w-full bg-[#12101b] border-2 border-[#453e61] rounded-lg p-1.5 flex items-center gap-2 shadow-[inset_2px_2px_0_#000]">
              <span className="text-amber-400 font-pixel text-xs pl-2">🔍</span>
              <input
                type="text"
                placeholder="BUSCAR JOGO OU SÉRIE..."
                className="w-full bg-transparent font-pixel text-[11px] text-gray-100 placeholder-gray-500 focus:outline-none"
              />
              <span className="font-pixel text-[8px] bg-[#2a253d] text-gray-400 px-1.5 py-1 rounded border border-gray-700">
                SELECT
              </span>
            </div>
          </div>

          {/* Right Retro Actions & Interactive Controls */}
          <div className="flex items-center gap-3">
            {/* Coin Clicker (Fun 16-bit interactive element) */}
            <button
              onClick={() => setCoinCount((c) => c + 1)}
              className="retro-btn bg-[#2a253d] hover:bg-[#383152] border-2 border-amber-400 text-amber-300 px-3 py-1.5 rounded font-pixel text-[10px] flex items-center gap-2 retro-shadow-sm transition-all"
              title="Clique para adicionar fichas!"
            >
              <span>🪙</span>
              <span>COINS: {coinCount}</span>
            </button>

            {/* CRT Scanline Toggle */}
            <button
              onClick={() => setScanlinesActive(!scanlinesActive)}
              className={`retro-btn px-3 py-1.5 rounded font-pixel text-[10px] border-2 flex items-center gap-1.5 transition-all ${
                scanlinesActive
                  ? 'bg-emerald-700 border-emerald-400 text-white retro-shadow-sm'
                  : 'bg-[#181622] border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              <span>📺</span>
              <span className="hidden sm:inline">CRT: {scanlinesActive ? 'ON' : 'OFF'}</span>
            </button>

            {/* Inserir Cartucho Action */}
            <button className="retro-btn bg-amber-400 hover:bg-amber-300 text-gray-950 border-2 border-black font-pixel text-[10px] px-3.5 py-1.5 rounded retro-shadow transition-all flex items-center gap-1.5">
              <span>+</span>
              <span className="hidden sm:inline">NOVO CARTUCHO</span>
            </button>
          </div>
        </nav>

        {/* Bottom Color Accent Line (SNES Button Colors: Purple / Lavender / Amber / Blue) */}
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#805ad5]" /> {/* SNES Deep Purple */}
          <div className="flex-1 bg-[#b794f4]" /> {/* SNES Light Purple */}
          <div className="flex-1 bg-[#ecc94b]" /> {/* SNES Accent Yellow */}
          <div className="flex-1 bg-[#4299e1]" /> {/* SNES Accent Blue */}
        </div>
      </header>

      {/* SHOWCASE CONTENT: DEMONSTRATING THE 16-BIT DESIGN SYSTEM */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Banner de Demonstração / Introdução */}
        <section className="bg-gradient-to-br from-[#231e36] to-[#151222] border-4 border-black rounded-2xl p-6 sm:p-8 retro-shadow relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-purple-950/80 border-2 border-purple-400 px-3 py-1 rounded-md">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
              <span className="font-pixel text-[10px] text-purple-200">
                PROPOSTA DE NOVO DESIGN SYSTEM 16-BIT
              </span>
            </div>

            <h1 className="font-pixel text-xl sm:text-3xl text-amber-300 leading-snug drop-shadow-[2px_2px_0_#000]">
              ESTÉTICA SUPER NINTENDO VINTAGE
            </h1>

            <p className="font-silkscreen text-sm sm:text-base text-gray-300 leading-relaxed">
              Substituímos o visual genérico e flat por um design com personalidade pura de console 16-bit:
              bordas plásticas chanfradas do SNES, tipografia arcade pixelada, botões com clique tátil e a nova
              logo oficial com chaveiro animado.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <Link
                href="/pt/snes-games"
                className="retro-btn bg-purple-600 hover:bg-purple-500 text-white font-pixel text-xs px-5 py-3 rounded-lg border-2 border-black retro-shadow flex items-center gap-2"
              >
                <span>🎮</span>
                <span>VOLTAR AO SITE ATUAL</span>
              </Link>
              <span className="font-silkscreen text-xs text-gray-400">
                (Esta página é um ambiente de testes para você validar antes de aplicarmos no site todo!)
              </span>
            </div>
          </div>

          {/* Decorative retro watermarks */}
          <div className="absolute right-4 top-4 opacity-15 pointer-events-none hidden md:block">
            <img src="/images/logo-transparent.png" alt="" className="w-72" />
          </div>
        </section>

        {/* 1. COMPARAÇÃO: COMPONENTES 16-BIT */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-purple-500/30 pb-3">
            <span className="text-2xl">🕹️</span>
            <div>
              <h2 className="font-pixel text-base sm:text-lg text-white">
                1. BOTÕES E CONTROLES 16-BIT (FEELING TÁTIL RETRÔ)
              </h2>
              <p className="font-silkscreen text-xs text-gray-400">
                Botões inspirados no controle original do Super Nintendo com sombras rígidas e clique tátil.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Botão A (Roxo Escuro / Ação Principal) */}
            <div className="bg-[#181524] border-2 border-black rounded-xl p-5 retro-shadow flex flex-col gap-3">
              <span className="font-pixel text-[10px] text-purple-300">BOTÃO A (AÇÃO FORTE)</span>
              <button className="retro-btn w-full bg-[#702459] hover:bg-[#862e6b] text-white font-pixel text-xs py-3 rounded-lg border-2 border-black retro-shadow flex items-center justify-center gap-2">
                <span>▶</span>
                <span>PRESS START</span>
              </button>
              <span className="text-[11px] text-gray-400 font-silkscreen">
                Cor original do botão A do SNES Americano
              </span>
            </div>

            {/* Botão B (Roxo Claro) */}
            <div className="bg-[#181524] border-2 border-black rounded-xl p-5 retro-shadow flex flex-col gap-3">
              <span className="font-pixel text-[10px] text-purple-300">BOTÃO B (SECUNDÁRIO)</span>
              <button className="retro-btn w-full bg-[#9f7aea] hover:bg-[#b794f4] text-gray-950 font-pixel text-xs py-3 rounded-lg border-2 border-black retro-shadow flex items-center justify-center gap-2">
                <span>⭐</span>
                <span>FAVORITAR</span>
              </button>
              <span className="text-[11px] text-gray-400 font-silkscreen">
                Lilás suave correspondente aos botões Y / B
              </span>
            </div>

            {/* Botão Insert Coin / Dourado */}
            <div className="bg-[#181524] border-2 border-black rounded-xl p-5 retro-shadow flex flex-col gap-3">
              <span className="font-pixel text-[10px] text-amber-400">BOTÃO DE OURO (SPECIAL)</span>
              <button className="retro-btn w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-pixel text-xs py-3 rounded-lg border-2 border-black retro-shadow flex items-center justify-center gap-2">
                <span>🪙</span>
                <span>INSERT COIN</span>
              </button>
              <span className="text-[11px] text-gray-400 font-silkscreen">
                Destaque máximo para botões de compra ou jogar
              </span>
            </div>

            {/* Botão Moldura Cartucho */}
            <div className="bg-[#181524] border-2 border-black rounded-xl p-5 retro-shadow flex flex-col gap-3">
              <span className="font-pixel text-[10px] text-gray-300">MOLDURA CHANFRADA (BEVEL)</span>
              <button className="snes-bevel-raised retro-btn w-full bg-[#363248] hover:bg-[#433e59] text-white font-pixel text-xs py-3 rounded flex items-center justify-center gap-2">
                <span>💾</span>
                <span>SAVE STATE</span>
              </button>
              <span className="text-[11px] text-gray-400 font-silkscreen">
                Efeito plástico cinza fosco 3D do cartucho
              </span>
            </div>
          </div>
        </section>

        {/* 2. COMPARAÇÃO: NOVO CARD DE CARTUCHO 16-BIT */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-purple-500/30 pb-3">
            <span className="text-2xl">📼</span>
            <div>
              <h2 className="font-pixel text-base sm:text-lg text-white">
                2. NOVO DESIGN DOS CARDS DE CARTUCHO
              </h2>
              <p className="font-silkscreen text-xs text-gray-400">
                O card agora se parece com um cartucho de verdade de Super Nintendo (com os sulcos laterais e o rótulo frontal).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Exemplo 1: Super Metroid */}
            <div className="group bg-[#2a263b] border-4 border-black rounded-2xl p-3.5 retro-shadow hover:-translate-y-1.5 transition-all relative">
              {/* Sulcos do cartucho no topo */}
              <div className="flex items-center justify-between pb-2 border-b-2 border-black px-1">
                <span className="font-pixel text-[8px] text-purple-300 bg-black/40 px-1.5 py-0.5 rounded">
                  SNS-SM-USA
                </span>
                <span className="font-pixel text-[8px] text-amber-400">1994</span>
              </div>

              {/* Rótulo Central do Jogo com borda chanfrada */}
              <div className="relative mt-2.5 rounded-xl overflow-hidden border-2 border-black snes-bevel-inset bg-black">
                <img
                  src="https://classicgamezone.com/games/covers/snes/super-metroid.jpg"
                  alt="Super Metroid"
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute top-2 left-2 font-pixel text-[8px] bg-red-600 text-white px-2 py-0.5 rounded border border-black shadow">
                  AÇÃO / METROIDVANIA
                </span>
              </div>

              {/* Título & Detalhes com Tipografia Retro */}
              <div className="mt-3 space-y-2">
                <h3 className="font-pixel text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                  Super Metroid
                </h3>
                <div className="flex items-center justify-between font-silkscreen text-[11px] text-gray-400">
                  <span>Nintendo / R&D1</span>
                  <span className="text-purple-300 font-bold">SNES</span>
                </div>
              </div>

              {/* Botão Jogar estilo Cartucho */}
              <div className="mt-3 pt-2 border-t-2 border-black/40">
                <Link
                  href="/pt/games/super-metroid"
                  className="retro-btn w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-pixel text-[10px] py-2 rounded-lg border-2 border-black flex items-center justify-center gap-1.5 retro-shadow-sm"
                >
                  <span>▶</span>
                  <span>JOGAR CARTUCHO</span>
                </Link>
              </div>
            </div>

            {/* Exemplo 2: Donkey Kong Country */}
            <div className="group bg-[#2a263b] border-4 border-black rounded-2xl p-3.5 retro-shadow hover:-translate-y-1.5 transition-all relative">
              <div className="flex items-center justify-between pb-2 border-b-2 border-black px-1">
                <span className="font-pixel text-[8px] text-purple-300 bg-black/40 px-1.5 py-0.5 rounded">
                  SNS-8X-USA
                </span>
                <span className="font-pixel text-[8px] text-amber-400">1994</span>
              </div>

              <div className="relative mt-2.5 rounded-xl overflow-hidden border-2 border-black snes-bevel-inset bg-black">
                <img
                  src="https://classicgamezone.com/games/covers/snes/donkey-kong-country.jpg"
                  alt="Donkey Kong Country"
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute top-2 left-2 font-pixel text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded border border-black shadow">
                  PLATAFORMA
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <h3 className="font-pixel text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                  Donkey Kong Country
                </h3>
                <div className="flex items-center justify-between font-silkscreen text-[11px] text-gray-400">
                  <span>Rareware</span>
                  <span className="text-purple-300 font-bold">SNES</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t-2 border-black/40">
                <Link
                  href="/pt/games/donkey-kong-country"
                  className="retro-btn w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-pixel text-[10px] py-2 rounded-lg border-2 border-black flex items-center justify-center gap-1.5 retro-shadow-sm"
                >
                  <span>▶</span>
                  <span>JOGAR CARTUCHO</span>
                </Link>
              </div>
            </div>

            {/* Exemplo 3: Chrono Trigger */}
            <div className="group bg-[#2a263b] border-4 border-black rounded-2xl p-3.5 retro-shadow hover:-translate-y-1.5 transition-all relative">
              <div className="flex items-center justify-between pb-2 border-b-2 border-black px-1">
                <span className="font-pixel text-[8px] text-purple-300 bg-black/40 px-1.5 py-0.5 rounded">
                  SNS-ACTE-USA
                </span>
                <span className="font-pixel text-[8px] text-amber-400">1995</span>
              </div>

              <div className="relative mt-2.5 rounded-xl overflow-hidden border-2 border-black snes-bevel-inset bg-black">
                <img
                  src="https://classicgamezone.com/games/covers/snes/chrono-trigger.jpg"
                  alt="Chrono Trigger"
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute top-2 left-2 font-pixel text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded border border-black shadow">
                  RPG
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <h3 className="font-pixel text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                  Chrono Trigger
                </h3>
                <div className="flex items-center justify-between font-silkscreen text-[11px] text-gray-400">
                  <span>Squaresoft</span>
                  <span className="text-purple-300 font-bold">SNES</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t-2 border-black/40">
                <Link
                  href="/pt/games/chrono-trigger"
                  className="retro-btn w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-pixel text-[10px] py-2 rounded-lg border-2 border-black flex items-center justify-center gap-1.5 retro-shadow-sm"
                >
                  <span>▶</span>
                  <span>JOGAR CARTUCHO</span>
                </Link>
              </div>
            </div>

            {/* Exemplo 4: Super Mario World */}
            <div className="group bg-[#2a263b] border-4 border-black rounded-2xl p-3.5 retro-shadow hover:-translate-y-1.5 transition-all relative">
              <div className="flex items-center justify-between pb-2 border-b-2 border-black px-1">
                <span className="font-pixel text-[8px] text-purple-300 bg-black/40 px-1.5 py-0.5 rounded">
                  SNS-MW-USA
                </span>
                <span className="font-pixel text-[8px] text-amber-400">1990</span>
              </div>

              <div className="relative mt-2.5 rounded-xl overflow-hidden border-2 border-black snes-bevel-inset bg-black">
                <img
                  src="https://classicgamezone.com/games/covers/snes/super-mario-world.jpg"
                  alt="Super Mario World"
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute top-2 left-2 font-pixel text-[8px] bg-yellow-500 text-black font-bold px-2 py-0.5 rounded border border-black shadow">
                  CLÁSSICO
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <h3 className="font-pixel text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                  Super Mario World
                </h3>
                <div className="flex items-center justify-between font-silkscreen text-[11px] text-gray-400">
                  <span>Nintendo</span>
                  <span className="text-purple-300 font-bold">SNES</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t-2 border-black/40">
                <Link
                  href="/pt/games/super-mario-world"
                  className="retro-btn w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-pixel text-[10px] py-2 rounded-lg border-2 border-black flex items-center justify-center gap-1.5 retro-shadow-sm"
                >
                  <span>▶</span>
                  <span>JOGAR CARTUCHO</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. RECURSOS DO DESIGN SYSTEM EXPLICADOS */}
        <section className="bg-[#181525] border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="font-pixel text-base text-amber-300 flex items-center gap-2">
            <span>⚙️</span>
            <span>RESUMO DAS MUDANÇAS PROPOSTAS:</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-silkscreen text-xs">
            <div className="bg-[#110f1a] p-4 rounded-xl border border-purple-500/20 space-y-2">
              <span className="font-pixel text-[11px] text-purple-300 block">
                🔑 1. Logo com Chaveiro Físico
              </span>
              <p className="text-gray-300 leading-relaxed">
                Utiliza a logo em pixel art que você enviou. Implementamos uma física de balanço sutil pendular no chaveiro que acelera suavemente quando o usuário passa o mouse por cima.
              </p>
            </div>

            <div className="bg-[#110f1a] p-4 rounded-xl border border-purple-500/20 space-y-2">
              <span className="font-pixel text-[11px] text-amber-300 block">
                📺 2. 100% Identidade 16-Bit
              </span>
              <p className="text-gray-300 leading-relaxed">
                Abandona o visual de site genérico e adota a textura de cartuchos reais de SNES, sombras duras (pixel box-shadow), fontes estilo arcade e LED de ligar/desligar no topo.
              </p>
            </div>

            <div className="bg-[#110f1a] p-4 rounded-xl border border-purple-500/20 space-y-2">
              <span className="font-pixel text-[11px] text-emerald-300 block">
                🎮 3. Efeitos Interativos
              </span>
              <p className="text-gray-300 leading-relaxed">
                Adicionamos contador de fichas (Coins), opção de ativar/desativar linhas CRT de televisão retrô e botões táteis que afundam ao clicar com som visual.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

