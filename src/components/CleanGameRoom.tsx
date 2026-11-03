'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Game } from '@/types/game';
import { SITE_CONFIG } from '@/config/site';
import { resolveRomUrl } from '@/lib/catalog';
import {
  addRecentId,
  getCustomGames,
  loadRomBlobUrlFromIDB,
} from '@/lib/storage';

interface CleanGameRoomProps {
  game?: Game;
  gameId: string;
}

const SNES_INPUTS = {
  B: { index: 0, key: 'z', code: 'KeyZ', keyCode: 90 },
  Y: { index: 1, key: 'a', code: 'KeyA', keyCode: 65 },
  SELECT: { index: 2, key: 'Shift', code: 'ShiftRight', keyCode: 16 },
  START: { index: 3, key: 'Enter', code: 'Enter', keyCode: 13 },
  UP: { index: 4, key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  DOWN: { index: 5, key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  LEFT: { index: 6, key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  RIGHT: { index: 7, key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  A: { index: 8, key: 'x', code: 'KeyX', keyCode: 88 },
  X: { index: 9, key: 's', code: 'KeyS', keyCode: 83 },
  L: { index: 10, key: 'q', code: 'KeyQ', keyCode: 81 },
  R: { index: 11, key: 'w', code: 'KeyW', keyCode: 87 },
} as const;

type SnesButtonKey = keyof typeof SNES_INPUTS;

export default function CleanGameRoom({ game: initialGame, gameId }: CleanGameRoomProps) {
  const router = useRouter();
  const [resolvedGame, setResolvedGame] = useState<Game | undefined>(initialGame);
  const [romSourceUrl, setRomSourceUrl] = useState<string>('');
  const [romReady, setRomReady] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [pressedButtons, setPressedButtons] = useState<Record<string, boolean>>({});

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dpadRef = useRef<HTMLDivElement>(null);
  const activeDpadDirsRef = useRef<SnesButtonKey[]>([]);

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
    description: '',
    imageUrl: 'https://classicgamezone.com/games/covers/snes/super-metroid.jpg',
  };

  // Detect screen orientation and touch capability
  useEffect(() => {
    const checkViewport = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth <= 1024;
      setIsTouchDevice(hasTouch);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Load ROM URL (IndexedDB custom ROM first, otherwise catalog proxy)
  useEffect(() => {
    let mounted = true;
    addRecentId(game.id);
    loadRomBlobUrlFromIDB(game.id).then((saved) => {
      if (!mounted) return;
      if (saved) {
        setRomSourceUrl(saved.url);
      } else {
        setRomSourceUrl(resolveRomUrl(game));
      }
      setRomReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [game]);

  const sendGamepadInput = useCallback((btn: SnesButtonKey, pressed: boolean) => {
    const meta = SNES_INPUTS[btn];
    setPressedButtons((prev) => {
      if (Boolean(prev[btn]) === pressed) return prev;
      return { ...prev, [btn]: pressed };
    });

    if (pressed && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {
        // ignore
      }
    }

    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage(
        {
          type: 'CARTUCHOS_INPUT',
          index: meta.index,
          pressed,
          key: meta.key,
          code: meta.code,
          keyCode: meta.keyCode,
        },
        '*'
      );
    }
  }, []);

  const updateDpadFromTouch = useCallback(
    (clientX: number, clientY: number) => {
      const el = dpadRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const deadzone = rect.width * 0.12;

      const nextDirs: SnesButtonKey[] = [];
      if (Math.abs(dx) > deadzone || Math.abs(dy) > deadzone) {
        if (dx < -deadzone) nextDirs.push('LEFT');
        if (dx > deadzone) nextDirs.push('RIGHT');
        if (dy < -deadzone) nextDirs.push('UP');
        if (dy > deadzone) nextDirs.push('DOWN');
      }

      const prevDirs = activeDpadDirsRef.current;
      for (const oldDir of prevDirs) {
        if (!nextDirs.includes(oldDir)) {
          sendGamepadInput(oldDir, false);
        }
      }
      for (const newDir of nextDirs) {
        if (!prevDirs.includes(newDir)) {
          sendGamepadInput(newDir, true);
        }
      }
      activeDpadDirsRef.current = nextDirs;
    },
    [sendGamepadInput]
  );

  const releaseAllDpad = useCallback(() => {
    for (const dir of activeDpadDirsRef.current) {
      sendGamepadInput(dir, false);
    }
    activeDpadDirsRef.current = [];
  }, [sendGamepadInput]);

  const bindButtonEvents = (btn: SnesButtonKey) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      sendGamepadInput(btn, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      sendGamepadInput(btn, false);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      sendGamepadInput(btn, false);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  // Build clean EmulatorJS HTML with EmulatorJS's own overlapping virtual gamepad COMPLETELY HIDDEN
  const buildCleanEmulatorHtml = (romUrl: string, title: string) => {
    const safeTitle = title.replace(/'/g, "\\'");
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #000000;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    #game {
      width: 100% !important;
      height: 100% !important;
      image-rendering: pixelated !important;
      image-rendering: -moz-crisp-edges !important;
      image-rendering: crisp-edges !important;
      transform: translateZ(0);
      will-change: transform;
    }
    #game canvas {
      width: 100% !important;
      height: 100% !important;
      image-rendering: pixelated !important;
      image-rendering: -moz-crisp-edges !important;
      image-rendering: crisp-edges !important;
    }
    /* Force hide EmulatorJS built-in overlapping touch gamepad so the game screen is 100% clean! */
    .ejs_virtual_gamepad_parent,
    .ejs_virtual_gamepad,
    .ejs_dpad_main,
    div[class*="virtual_gamepad"],
    div[class*="ejs_virtual"] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      width: 0 !important;
      height: 0 !important;
    }
  </style>
</head>
<body>
  <div id="game"></div>
  <script>
    window.EJS_player = '#game';
    window.EJS_gameName = '${safeTitle}';
    window.EJS_gameUrl = '${romUrl}';
    window.EJS_core = 'snes';
    window.EJS_pathtodata = '${SITE_CONFIG.emulatorDataCdn}';
    window.EJS_startOnLoaded = true;
    window.EJS_volume = 0.7;
    window.EJS_disableAutoLang = true;
    window.EJS_language = 'en-US';
    window.EJS_color = '#f59e0b';
    window.EJS_threads = false;
    window.EJS_cacheLimit = 500;
    window.EJS_forceTouchControls = false;
    window.EJS_VirtualGamepadSettings = [];
    window.EJS_defaultOptions = {
      'virtual-gamepad': 'disabled',
      'shader': 'disabled',
      'rewind': 'disabled',
      'vsync': 'enabled'
    };
    window.EJS_Buttons = {
      playPause: true,
      restart: true,
      mute: true,
      settings: true,
      fullscreen: false,
      saveState: true,
      loadState: true,
      screenRecord: false,
      gamepad: true,
      cheat: false,
      volume: true,
      saveSavFiles: true,
      loadSavFiles: true,
      quickSave: true,
      quickLoad: true,
      screenshot: false,
      cacheManager: false
    };

    window.EJS_onGameStart = function() {
      try {
        if (window.EJS_emulator) {
          if (typeof window.EJS_emulator.toggleVirtualGamepad === 'function') {
            window.EJS_emulator.toggleVirtualGamepad(false);
          }
          if (window.EJS_emulator.settings) {
            window.EJS_emulator.settings['virtual-gamepad'] = 'disabled';
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', function(ev) {
      var data = ev.data;
      if (!data || data.type !== 'CARTUCHOS_INPUT') return;

      try {
        if (window.EJS_emulator && window.EJS_emulator.audio && typeof window.EJS_emulator.audio.resume === 'function') {
          window.EJS_emulator.audio.resume();
        }
        if (window.EJS_emulator && window.EJS_emulator.Module && window.EJS_emulator.Module.SDL2 && window.EJS_emulator.Module.SDL2.audioContext) {
          window.EJS_emulator.Module.SDL2.audioContext.resume();
        }
      } catch (e) {}

      var handled = false;
      try {
        if (window.EJS_emulator && window.EJS_emulator.gameManager && typeof window.EJS_emulator.gameManager.simulateInput === 'function') {
          window.EJS_emulator.gameManager.simulateInput(0, data.index, data.pressed ? 1 : 0);
          handled = true;
        }
      } catch (e) {}

      if (!handled && data.key) {
        var evType = data.pressed ? 'keydown' : 'keyup';
        var keyEv = new KeyboardEvent(evType, {
          key: data.key,
          code: data.code,
          keyCode: data.keyCode,
          which: data.keyCode,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(keyEv);
        window.dispatchEvent(keyEv);
      }
    });
  </script>
  <script src="${SITE_CONFIG.emulatorDataCdn}loader.js"></script>
</body>
</html>`;
  };

  // D-Pad component reused in both Portrait and Landscape docks
  const renderDpad = (sizeClass = 'w-36 h-36') => (
    <div
      ref={dpadRef}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        updateDpadFromTouch(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0 || activeDpadDirsRef.current.length > 0) {
          e.preventDefault();
          updateDpadFromTouch(e.clientX, e.clientY);
        }
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        releaseAllDpad();
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
        releaseAllDpad();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative ${sizeClass} rounded-full bg-[#221e35] border-2 border-purple-500/40 shadow-xl flex items-center justify-center touch-none select-none shrink-0`}
    >
      <div
        className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-t-xl flex items-center justify-center font-bold text-base border transition-colors ${
          pressedButtons.UP
            ? 'bg-amber-400 text-gray-950 border-amber-200'
            : 'bg-[#13101f] text-gray-300 border-purple-500/30'
        }`}
      >
        ▲
      </div>
      <div
        className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-b-xl flex items-center justify-center font-bold text-base border transition-colors ${
          pressedButtons.DOWN
            ? 'bg-amber-400 text-gray-950 border-amber-200'
            : 'bg-[#13101f] text-gray-300 border-purple-500/30'
        }`}
      >
        ▼
      </div>
      <div
        className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-l-xl flex items-center justify-center font-bold text-base border transition-colors ${
          pressedButtons.LEFT
            ? 'bg-amber-400 text-gray-950 border-amber-200'
            : 'bg-[#13101f] text-gray-300 border-purple-500/30'
        }`}
      >
        ◀
      </div>
      <div
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-r-xl flex items-center justify-center font-bold text-base border transition-colors ${
          pressedButtons.RIGHT
            ? 'bg-amber-400 text-gray-950 border-amber-200'
            : 'bg-[#13101f] text-gray-300 border-purple-500/30'
        }`}
      >
        ▶
      </div>
      <div className="w-8 h-8 rounded-full bg-[#191528] border border-purple-500/20 z-10" />
    </div>
  );

  // Action Diamond (X, Y, A, B) reused in both Portrait and Landscape docks
  const renderActionButtons = (sizeClass = 'w-36 h-36') => (
    <div
      className={`relative ${sizeClass} rounded-full bg-[#221e35] border-2 border-purple-500/40 shadow-xl touch-none select-none shrink-0`}
    >
      {/* X (Top - Blue) */}
      <button
        type="button"
        {...bindButtonEvents('X')}
        className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full font-extrabold text-sm text-white border-2 shadow-md transition-transform ${
          pressedButtons.X
            ? 'bg-blue-400 border-white scale-90'
            : 'bg-blue-600 border-blue-300/60'
        }`}
      >
        X
      </button>
      {/* Y (Left - Green) */}
      <button
        type="button"
        {...bindButtonEvents('Y')}
        className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full font-extrabold text-sm text-white border-2 shadow-md transition-transform ${
          pressedButtons.Y
            ? 'bg-emerald-400 border-white scale-90'
            : 'bg-emerald-600 border-emerald-300/60'
        }`}
      >
        Y
      </button>
      {/* A (Right - Red) */}
      <button
        type="button"
        {...bindButtonEvents('A')}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full font-extrabold text-sm text-white border-2 shadow-md transition-transform ${
          pressedButtons.A
            ? 'bg-rose-400 border-white scale-90'
            : 'bg-rose-600 border-rose-300/60'
        }`}
      >
        A
      </button>
      {/* B (Bottom - Yellow) */}
      <button
        type="button"
        {...bindButtonEvents('B')}
        className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full font-extrabold text-sm text-gray-950 border-2 shadow-md transition-transform ${
          pressedButtons.B
            ? 'bg-yellow-300 border-white scale-90'
            : 'bg-amber-400 border-yellow-200/80'
        }`}
      >
        B
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] bg-[#0b0914] text-white flex flex-col overflow-hidden select-none">
      {/* Ultra-slim Top Console Bar (38px) */}
      <header className="h-10 px-3 bg-[#181527] border-b-2 border-black flex items-center justify-between gap-2 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/pt/snes-games')}
            className="retro-btn px-2.5 py-1 rounded-lg bg-[#27233c] hover:bg-purple-600 font-pixel text-[8px] text-gray-200 border-2 border-black flex items-center gap-1 shrink-0 retro-shadow-sm transition-all"
          >
            <span>◀</span>
            <span>CATÁLOGO</span>
          </button>

          <h1 className="font-pixel text-[10px] text-amber-400 truncate drop-shadow-[1px_1px_0_#000]">
            {game.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            className="retro-btn px-2 py-1 rounded-lg bg-[#27233c] hover:bg-[#342f4e] font-pixel text-[9px] text-gray-200 border-2 border-black retro-shadow-sm transition-all"
            title="Reiniciar Jogo"
          >
            🔄
          </button>

          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            className={`retro-btn px-2.5 py-1 rounded-lg font-pixel text-[8px] border-2 border-black transition-all ${
              showControls
                ? 'bg-emerald-600 border-black text-white retro-shadow-sm'
                : 'bg-[#27233c] text-gray-400'
            }`}
          >
            🎮 {showControls ? 'PAD ON' : 'PAD OFF'}
          </button>
        </div>
      </header>

      {/* Main Console Body:
          - In Portrait: Top = Clean Game Screen, Bottom = Dedicated Physical Controller Dock (ZERO OVERLAP!)
          - In Landscape: Left = L + D-Pad + Select, Center = Clean Game Screen, Right = R + X/Y/A/B + Start (ZERO OVERLAP!) */}
      {isLandscape && showControls ? (
        /* LANDSCAPE HANDHELD MODE (Switch / Portable SNES style: Left Pad | Game Screen | Right Pad) */
        <div className="flex-1 min-h-0 w-full flex flex-row items-stretch bg-[#09080f] overflow-hidden">
          {/* Left Controller Grip */}
          <div className="w-44 sm:w-48 bg-gradient-to-b from-[#1b172c] to-[#120f1d] border-r border-purple-500/30 p-2.5 flex flex-col items-center justify-between shrink-0">
            <button
              type="button"
              {...bindButtonEvents('L')}
              className={`w-full h-9 rounded-t-xl rounded-b-md font-extrabold text-xs tracking-widest border-2 ${
                pressedButtons.L
                  ? 'bg-amber-400 text-gray-950 border-amber-200'
                  : 'bg-[#2a2440] text-gray-200 border-purple-400/40'
              }`}
            >
              L
            </button>

            {renderDpad('w-36 h-36')}

            <div className="flex items-center gap-2 pb-1">
              <button
                type="button"
                {...bindButtonEvents('SELECT')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  pressedButtons.SELECT
                    ? 'bg-amber-400 text-gray-950 border-amber-200'
                    : 'bg-[#2a2440] text-gray-200 border-purple-400/40'
                }`}
              >
                Select
              </button>
            </div>
          </div>

          {/* Center 100% Unobstructed Game Screen */}
          <div className="flex-1 min-w-0 h-full bg-black flex items-center justify-center relative overflow-hidden">
            {romReady && (
              <iframe
                ref={iframeRef}
                key={iframeKey}
                title={`SNES - ${game.title}`}
                srcDoc={buildCleanEmulatorHtml(romSourceUrl, game.title)}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; gamepad"
              />
            )}
          </div>

          {/* Right Controller Grip */}
          <div className="w-44 sm:w-48 bg-gradient-to-b from-[#1b172c] to-[#120f1d] border-l border-purple-500/30 p-2.5 flex flex-col items-center justify-between shrink-0">
            <button
              type="button"
              {...bindButtonEvents('R')}
              className={`w-full h-9 rounded-t-xl rounded-b-md font-extrabold text-xs tracking-widest border-2 ${
                pressedButtons.R
                  ? 'bg-amber-400 text-gray-950 border-amber-200'
                  : 'bg-[#2a2440] text-gray-200 border-purple-400/40'
              }`}
            >
              R
            </button>

            {renderActionButtons('w-36 h-36')}

            <div className="flex items-center gap-2 pb-1">
              <button
                type="button"
                {...bindButtonEvents('START')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  pressedButtons.START
                    ? 'bg-amber-400 text-gray-950 border-amber-200'
                    : 'bg-[#2a2440] text-gray-200 border-purple-400/40'
                }`}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PORTRAIT SMARTPHONE MODE (or Desktop without side pads):
           Top = 100% Clean Unobstructed Game Screen
           Bottom = Dedicated SNES Controller Deck (Separated below the game!) */
        <div className="flex-1 min-h-0 w-full flex flex-col bg-[#09080f] overflow-hidden">
          {/* Top Game Screen Container (Never covered by buttons!) */}
          <div
            className={`w-full bg-black flex items-center justify-center relative overflow-hidden ${
              showControls && isTouchDevice
                ? 'h-[46dvh] sm:h-[52dvh] shrink-0 border-b-2 border-purple-500/40'
                : 'flex-1 min-h-0'
            }`}
          >
            {romReady && (
              <iframe
                ref={iframeRef}
                key={iframeKey}
                title={`SNES - ${game.title}`}
                srcDoc={buildCleanEmulatorHtml(romSourceUrl, game.title)}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; gamepad"
              />
            )}
          </div>

          {/* Bottom Dedicated SNES Physical Gamepad Deck */}
          {showControls && (
            <div className="flex-1 min-h-0 w-full bg-gradient-to-b from-[#1c182c] to-[#110e1b] px-4 py-3 flex flex-col justify-between touch-none select-none">
              {/* Top Row: L & R Shoulder Buttons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  {...bindButtonEvents('L')}
                  className={`w-28 h-10 rounded-t-2xl rounded-b-lg font-extrabold text-sm tracking-widest border-2 shadow-md transition-transform ${
                    pressedButtons.L
                      ? 'bg-amber-400 text-gray-950 border-amber-200 scale-95'
                      : 'bg-[#2a2440] text-gray-200 border-purple-400/40'
                  }`}
                >
                  L
                </button>

                <span className="text-[10px] font-extrabold tracking-widest uppercase text-purple-300/60">
                  SUPER NINTENDO
                </span>

                <button
                  type="button"
                  {...bindButtonEvents('R')}
                  className={`w-28 h-10 rounded-t-2xl rounded-b-lg font-extrabold text-sm tracking-widest border-2 shadow-md transition-transform ${
                    pressedButtons.R
                      ? 'bg-amber-400 text-gray-950 border-amber-200 scale-95'
                      : 'bg-[#2a2440] text-gray-200 border-purple-400/40'
                  }`}
                >
                  R
                </button>
              </div>

              {/* Middle Row: D-Pad (Left) and X/Y/A/B Diamond (Right) */}
              <div className="flex items-center justify-between gap-2 my-auto">
                {renderDpad('w-36 h-36 sm:w-40 sm:h-40')}
                {renderActionButtons('w-36 h-36 sm:w-40 sm:h-40')}
              </div>

              {/* Bottom Row: Slanted SELECT & START Buttons */}
              <div className="flex items-center justify-center gap-8 pb-1">
                <button
                  type="button"
                  {...bindButtonEvents('SELECT')}
                  className={`px-5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow ${
                    pressedButtons.SELECT
                      ? 'bg-amber-400 text-gray-950 border-amber-200 scale-95'
                      : 'bg-[#2a2440] text-gray-200 border-purple-400/40'
                  }`}
                >
                  Select
                </button>

                <button
                  type="button"
                  {...bindButtonEvents('START')}
                  className={`px-5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow ${
                    pressedButtons.START
                      ? 'bg-amber-400 text-gray-950 border-amber-200 scale-95'
                      : 'bg-[#2a2440] text-gray-200 border-purple-400/40'
                  }`}
                >
                  Start
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
