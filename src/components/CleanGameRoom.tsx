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

  const fallbackGame: Game = resolvedGame || {
    id: gameId,
    title: gameId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    platform: 'SNES',
    genre: 'Action',
    year: 1994,
    description: '',
    imageUrl: 'https://classicgamezone.com/games/covers/snes/super-metroid.jpg',
  };

  // Resolve standard catalog ROM URL synchronously on first render so there is zero IDB delay
  const [romSourceUrl, setRomSourceUrl] = useState<string>(() =>
    initialGame ? resolveRomUrl(initialGame) : ''
  );
  const [recoveryKey, setRecoveryKey] = useState<number>(0);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  const padRootRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const dpadRef = useRef<HTMLDivElement>(null);
  const dpadRectRef = useRef<DOMRect | null>(null);
  const activeDpadDirsRef = useRef<SnesButtonKey[]>([]);
  const pressedStateRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!initialGame) {
      const custom = getCustomGames().find((g) => g.id === gameId);
      if (custom) setResolvedGame(custom);
    } else {
      setResolvedGame(initialGame);
    }
  }, [initialGame, gameId]);

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
      dpadRectRef.current = null;
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Load ROM URL (immediate for catalog games; check IndexedDB in background for custom ROMs)
  useEffect(() => {
    let mounted = true;
    addRecentId(fallbackGame.id);
    const defaultUrl = resolveRomUrl(fallbackGame);
    if (!romSourceUrl) {
      setRomSourceUrl(defaultUrl);
    }
    loadRomBlobUrlFromIDB(fallbackGame.id).then((saved) => {
      if (!mounted) return;
      if (saved && saved.url) {
        setRomSourceUrl(saved.url);
      } else {
        setRomSourceUrl((prev) => prev || defaultUrl);
      }
    });
    return () => {
      mounted = false;
    };
  }, [fallbackGame.id]);

  // Mount EmulatorJS 4.2.1 directly onto #game in the main DOM (identical to classicgamezone.com)
  useEffect(() => {
    if (!romSourceUrl) return;
    const gameEl = document.getElementById('game');
    if (!gameEl) return;

    const w = window as any;
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Clean any previous instance first
    const cleanupEmulator = () => {
      const oldEmulator = w.EJS_emulator;
      try {
        if (oldEmulator && typeof oldEmulator.pause === 'function') {
          oldEmulator.pause();
        }
        oldEmulator?.callEvent?.('exit');
      } catch {}
      try {
        if (oldEmulator?.audio?.context && oldEmulator.audio.context.state !== 'closed') {
          oldEmulator.audio.context.close().catch(() => {});
        }
      } catch {}
      try {
        if (oldEmulator) {
          oldEmulator.__cgzDisposed = true;
          if (oldEmulator.rafId) cancelAnimationFrame(oldEmulator.rafId);
          if (
            Array.isArray(oldEmulator.listeners) &&
            typeof oldEmulator.removeEventListener === 'function'
          ) {
            oldEmulator.removeEventListener([...oldEmulator.listeners]);
            oldEmulator.listeners = [];
          }
          if (oldEmulator.resetTimeout) clearTimeout(oldEmulator.resetTimeout);
          if (oldEmulator.msgTimeout) clearTimeout(oldEmulator.msgTimeout);
          oldEmulator.textElem = document.createElement('span');
          if (oldEmulator.gameManager) {
            oldEmulator.gameManager.simulateInput = () => {};
          } else {
            oldEmulator.gameManager = { simulateInput: () => {} };
          }
        }
      } catch {}
      gameEl.replaceChildren();
    };

    cleanupEmulator();

    w.EJS_player = '#game';
    w.EJS_gameName = fallbackGame.title;
    w.EJS_gameUrl = romSourceUrl;
    w.EJS_core = 'snes';
    w.EJS_pathtodata = SITE_CONFIG.emulatorDataCdn;
    w.EJS_startOnLoaded = true;
    w.EJS_volume = 0.5;
    w.EJS_language = 'pt-BR';
    w.EJS_threads = false;
    w.EJS_forceLegacyCores = isIOS ? true : undefined;
    w.EJS_cacheDecompressedCores = true;
    w.EJS_forceTouchControls = false;
    delete w.EJS_VirtualGamepadSettings;
    delete w.EJS_defaultOptions;

    const handleGameStart = () => {
      try {
        const emu = w.EJS_emulator;
        if (emu) {
          if (typeof emu.toggleVirtualGamepad === 'function') {
            emu.toggleVirtualGamepad(false);
          }
          if (emu.menu && typeof emu.menu.close === 'function') {
            requestAnimationFrame(() => emu.menu?.close?.());
          }
          if (typeof emu.handleResize === 'function') {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => emu.handleResize?.());
            });
          }
        }
      } catch {}
    };

    w.EJS_onGameStart = handleGameStart;

    const loaderScript = document.createElement('script');
    loaderScript.src = `${SITE_CONFIG.emulatorDataCdn}loader.js?v=4.2.1-safari-autostart-1&recovery=${recoveryKey}`;
    loaderScript.async = true;
    document.body.appendChild(loaderScript);

    return () => {
      if (w.EJS_onGameStart === handleGameStart) {
        w.EJS_onGameStart = undefined;
      }
      loaderScript.remove();
      cleanupEmulator();
      w.EJS_player = undefined;
      w.EJS_gameUrl = undefined;
      w.EJS_core = undefined;
      w.EJS_emulator = undefined;
    };
  }, [romSourceUrl, recoveryKey, fallbackGame.title]);

  // Keep WebGL canvas smoothly sized when rotating smartphone or toggling Pad ON/OFF without remounting
  useEffect(() => {
    const stageEl = stageContainerRef.current;
    if (!stageEl) return;
    let rafId: number | null = null;

    const triggerResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const w = window as any;
          w.EJS_emulator?.handleResize?.();
        });
      });
    };

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(triggerResize) : null;
    observer?.observe(stageEl);
    window.visualViewport?.addEventListener('resize', triggerResize);
    window.addEventListener('orientationchange', triggerResize);
    triggerResize();

    return () => {
      observer?.disconnect();
      window.visualViewport?.removeEventListener('resize', triggerResize);
      window.removeEventListener('orientationchange', triggerResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isLandscape, showControls, isTouchDevice]);

  // Zero-re-render direct input to EmulatorJS gameManager in the same window
  const sendGamepadInput = useCallback((btn: SnesButtonKey, pressed: boolean) => {
    if (Boolean(pressedStateRef.current[btn]) === pressed) return;
    pressedStateRef.current[btn] = pressed;

    // Update visual button active state directly in DOM (0 React re-renders!)
    const root = padRootRef.current;
    if (root) {
      const nodes = root.querySelectorAll<HTMLElement>(`[data-pad-btn="${btn}"]`);
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].setAttribute('data-active', pressed ? 'true' : 'false');
      }
    }

    const meta = SNES_INPUTS[btn];
    const w = window as any;
    const emu = w.EJS_emulator;

    // Only resume audio if suspended/interrupted (never spam resume on running audio!)
    if (pressed && emu) {
      try {
        const ctx1 = emu.audio?.context;
        if (ctx1 && (ctx1.state === 'suspended' || ctx1.state === 'interrupted')) {
          ctx1.resume().catch(() => {});
        }
        const ctx2 = emu.Module?.SDL2?.audioContext;
        if (ctx2 && (ctx2.state === 'suspended' || ctx2.state === 'interrupted')) {
          ctx2.resume().catch(() => {});
        }
        const ctx3 = emu.Module?.AL?.currentCtx?.audioCtx;
        if (ctx3 && (ctx3.state === 'suspended' || ctx3.state === 'interrupted')) {
          ctx3.resume().catch(() => {});
        }
      } catch {}
    }

    let handled = false;
    try {
      if (emu?.gameManager && typeof emu.gameManager.simulateInput === 'function') {
        emu.gameManager.simulateInput(0, meta.index, pressed ? 1 : 0);
        handled = true;
      }
    } catch {}

    if (!handled && meta.key) {
      const evType = pressed ? 'keydown' : 'keyup';
      const keyEv = new KeyboardEvent(evType, {
        key: meta.key,
        code: meta.code,
        keyCode: meta.keyCode,
        which: meta.keyCode,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(keyEv);
      window.dispatchEvent(keyEv);
    }
  }, []);

  const updateDpadFromTouch = useCallback(
    (clientX: number, clientY: number) => {
      const el = dpadRef.current;
      if (!el) return;
      if (!dpadRectRef.current) {
        dpadRectRef.current = el.getBoundingClientRect();
      }
      const rect = dpadRectRef.current;
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
      for (let i = 0; i < prevDirs.length; i++) {
        const oldDir = prevDirs[i];
        if (!nextDirs.includes(oldDir)) {
          sendGamepadInput(oldDir, false);
        }
      }
      for (let i = 0; i < nextDirs.length; i++) {
        const newDir = nextDirs[i];
        if (!prevDirs.includes(newDir)) {
          sendGamepadInput(newDir, true);
        }
      }
      activeDpadDirsRef.current = nextDirs;
    },
    [sendGamepadInput]
  );

  const releaseAllDpad = useCallback(() => {
    const prevDirs = activeDpadDirsRef.current;
    for (let i = 0; i < prevDirs.length; i++) {
      sendGamepadInput(prevDirs[i], false);
    }
    activeDpadDirsRef.current = [];
  }, [sendGamepadInput]);

  const bindButtonEvents = (btn: SnesButtonKey) => ({
    'data-pad-btn': btn,
    'data-active': 'false',
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

  // D-Pad component reused in both Portrait and Landscape docks
  const renderDpad = (sizeClass = 'w-36 h-36') => (
    <div
      ref={dpadRef}
      onPointerDown={(e) => {
        e.preventDefault();
        dpadRectRef.current = e.currentTarget.getBoundingClientRect();
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
        data-pad-btn="UP"
        data-active="false"
        className="absolute top-1.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-t-xl flex items-center justify-center font-bold text-base border bg-[#13101f] text-gray-300 border-purple-500/30 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
      >
        ▲
      </div>
      <div
        data-pad-btn="DOWN"
        data-active="false"
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-b-xl flex items-center justify-center font-bold text-base border bg-[#13101f] text-gray-300 border-purple-500/30 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
      >
        ▼
      </div>
      <div
        data-pad-btn="LEFT"
        data-active="false"
        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-l-xl flex items-center justify-center font-bold text-base border bg-[#13101f] text-gray-300 border-purple-500/30 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
      >
        ◀
      </div>
      <div
        data-pad-btn="RIGHT"
        data-active="false"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-r-xl flex items-center justify-center font-bold text-base border bg-[#13101f] text-gray-300 border-purple-500/30 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
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
        className="absolute top-1.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full font-extrabold text-sm text-white border-2 shadow-md bg-blue-600 border-blue-300/60 data-[active=true]:bg-blue-400 data-[active=true]:border-white data-[active=true]:scale-90"
      >
        X
      </button>
      {/* Y (Left - Green) */}
      <button
        type="button"
        {...bindButtonEvents('Y')}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full font-extrabold text-sm text-white border-2 shadow-md bg-emerald-600 border-emerald-300/60 data-[active=true]:bg-emerald-400 data-[active=true]:border-white data-[active=true]:scale-90"
      >
        Y
      </button>
      {/* A (Right - Red) */}
      <button
        type="button"
        {...bindButtonEvents('A')}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full font-extrabold text-sm text-white border-2 shadow-md bg-rose-600 border-rose-300/60 data-[active=true]:bg-rose-400 data-[active=true]:border-white data-[active=true]:scale-90"
      >
        A
      </button>
      {/* B (Bottom - Yellow) */}
      <button
        type="button"
        {...bindButtonEvents('B')}
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full font-extrabold text-sm text-gray-950 border-2 shadow-md bg-amber-400 border-yellow-200/80 data-[active=true]:bg-yellow-300 data-[active=true]:border-white data-[active=true]:scale-90"
      >
        B
      </button>
    </div>
  );

  const isHandheldLandscape = isLandscape && showControls;

  return (
    <div
      ref={padRootRef}
      className="fixed inset-0 w-screen h-[100dvh] bg-[#0b0914] text-white flex flex-col overflow-hidden select-none"
    >
      <style>{`
        .clean-emulator-stage #game {
          width: 100% !important;
          height: 100% !important;
        }
        /* Hide EmulatorJS built-in overlapping virtual gamepad so the game screen is 100% unobstructed */
        .clean-emulator-stage .ejs_virtual_gamepad_parent,
        .clean-emulator-stage .ejs_virtual_gamepad,
        .clean-emulator-stage .ejs_dpad_main,
        .clean-emulator-stage div[class*="virtual_gamepad"],
        .clean-emulator-stage div[class*="virtualpad"],
        .clean-emulator-stage div[class*="virtualGamepad"],
        .clean-emulator-stage div[class*="ejs_virtual"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>

      {/* Ultra-slim Top Console Bar */}
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
            {fallbackGame.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRecoveryKey((k) => k + 1)}
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

      {/* Unified Console Body:
          #game is ALWAYS the first child in the React tree (reordered via CSS flex order-1 / order-2)
          so rotating the phone or toggling Pad ON/OFF never unmounts the running emulator! */}
      <div
        className={`flex-1 min-h-0 w-full flex ${
          isHandheldLandscape ? 'flex-row items-stretch' : 'flex-col'
        } bg-[#09080f] overflow-hidden`}
      >
        {/* 1. Native Unobstructed Game Screen Host */}
        <div
          key="emulator-stage-host"
          ref={stageContainerRef}
          className={`clean-emulator-stage bg-black flex items-center justify-center relative overflow-hidden ${
            isHandheldLandscape
              ? 'order-2 flex-1 min-w-0 h-full'
              : showControls && isTouchDevice
                ? 'order-1 w-full h-[46dvh] sm:h-[52dvh] shrink-0 border-b-2 border-purple-500/40'
                : 'order-1 flex-1 min-h-0 w-full'
          }`}
        >
          <div id="game" className="w-full h-full" />
        </div>

        {/* 2. Controller Grips / Deck */}
        {isHandheldLandscape ? (
          <>
            {/* Left Controller Grip (order-1) */}
            <div className="order-1 w-44 sm:w-48 bg-gradient-to-b from-[#1b172c] to-[#120f1d] border-r border-purple-500/30 p-2.5 flex flex-col items-center justify-between shrink-0 touch-none select-none">
              <button
                type="button"
                {...bindButtonEvents('L')}
                className="w-full h-9 rounded-t-xl rounded-b-md font-extrabold text-xs tracking-widest border-2 bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
              >
                L
              </button>

              {renderDpad('w-36 h-36')}

              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  {...bindButtonEvents('SELECT')}
                  className="px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
                >
                  Select
                </button>
              </div>
            </div>

            {/* Right Controller Grip (order-3) */}
            <div className="order-3 w-44 sm:w-48 bg-gradient-to-b from-[#1b172c] to-[#120f1d] border-l border-purple-500/30 p-2.5 flex flex-col items-center justify-between shrink-0 touch-none select-none">
              <button
                type="button"
                {...bindButtonEvents('R')}
                className="w-full h-9 rounded-t-xl rounded-b-md font-extrabold text-xs tracking-widest border-2 bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
              >
                R
              </button>

              {renderActionButtons('w-36 h-36')}

              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  {...bindButtonEvents('START')}
                  className="px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
                >
                  Start
                </button>
              </div>
            </div>
          </>
        ) : (
          showControls && (
            /* Portrait Bottom Dedicated SNES Physical Gamepad Deck (order-2) */
            <div className="order-2 flex-1 min-h-0 w-full bg-gradient-to-b from-[#1c182c] to-[#110e1b] px-4 py-3 flex flex-col justify-between touch-none select-none">
              {/* Top Row: L & R Shoulder Buttons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  {...bindButtonEvents('L')}
                  className="w-28 h-10 rounded-t-2xl rounded-b-lg font-extrabold text-sm tracking-widest border-2 shadow-md bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 data-[active=true]:scale-95"
                >
                  L
                </button>

                <span className="text-[10px] font-extrabold tracking-widest uppercase text-purple-300/60">
                  SUPER NINTENDO
                </span>

                <button
                  type="button"
                  {...bindButtonEvents('R')}
                  className="w-28 h-10 rounded-t-2xl rounded-b-lg font-extrabold text-sm tracking-widest border-2 shadow-md bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 data-[active=true]:scale-95"
                >
                  R
                </button>
              </div>

              {/* Middle Row: D-Pad (Left) and X/Y/A/B Diamond (Right) */}
              <div className="flex items-center justify-between gap-2 my-auto">
                {renderDpad('w-36 h-36 sm:w-40 sm:h-40')}
                {renderActionButtons('w-36 h-36 sm:w-40 sm:h-40')}
              </div>

              {/* Bottom Row: SELECT & START Buttons */}
              <div className="flex items-center justify-center gap-8 pb-1">
                <button
                  type="button"
                  {...bindButtonEvents('SELECT')}
                  className="px-5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 data-[active=true]:scale-95"
                >
                  Select
                </button>

                <button
                  type="button"
                  {...bindButtonEvents('START')}
                  className="px-5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 data-[active=true]:scale-95"
                >
                  Start
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
