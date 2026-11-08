'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Game } from '@/types/game';
import { resolveRomUrl } from '@/lib/catalog';
import {
  addRecentId,
  getCustomGames,
  loadRomBlobUrlFromIDB,
  saveStateToIDB,
  loadStateFromIDB,
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

const NOSTALGIST_BUTTON_MAP: Record<SnesButtonKey, string> = {
  B: 'b',
  Y: 'y',
  SELECT: 'select',
  START: 'start',
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  A: 'a',
  X: 'x',
  L: 'l',
  R: 'r',
};

export default function CleanGameRoom({ game: initialGame, gameId }: CleanGameRoomProps) {
  const [resolvedGame, setResolvedGame] = useState<Game | undefined>(initialGame);
  const [isClosed, setIsClosed] = useState<boolean>(false);

  const fallbackGame: Game = resolvedGame || {
    id: gameId,
    title: gameId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    platform: 'SNES',
    genre: 'Action',
    year: 1994,
    description: '',
    imageUrl: 'https://classicgamezone.com/games/covers/snes/super-metroid.jpg',
  };

  // Resolve standard catalog ROM URL synchronously on first render
  const [romSourceUrl, setRomSourceUrl] = useState<string>(() =>
    initialGame ? resolveRomUrl(initialGame) : ''
  );
  const [recoveryKey, setRecoveryKey] = useState<number>(0);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('Carregando motor WebAssembly 16-Bit...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCore, setSelectedCore] = useState<'snes9x2010' | 'snes9x2005'>('snes9x2010');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nostalgistRef = useRef<any>(null);
  const padRootRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const dpadRef = useRef<HTMLDivElement>(null);
  const dpadRectRef = useRef<DOMRect | null>(null);
  const activeDpadDirsRef = useRef<SnesButtonKey[]>([]);
  const pressedStateRef = useRef<Record<string, boolean>>({});
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  // Unlock WebAudio immediately on first screen touch
  const unlockAudioContext = useCallback(() => {
    try {
      const w = window as any;
      if (w.__RETROARCH_AUDIO_CONTEXT && w.__RETROARCH_AUDIO_CONTEXT.state === 'suspended') {
        w.__RETROARCH_AUDIO_CONTEXT.resume().catch(() => {});
      }
      const emu = nostalgistRef.current;
      const al = emu?.getEmscriptenAL?.();
      const ctx = al?.currentCtx?.audioCtx;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {}
  }, []);

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

  // Mount Nostalgist.js WebAssembly emulator directly onto canvasRef
  useEffect(() => {
    if (!romSourceUrl || !canvasRef.current) return;
    let isCancelled = false;

    const startEmulator = async () => {
      setIsLoading(true);
      setLoadingStatus('Carregando motor WebAssembly 16-Bit...');
      setErrorMessage(null);

      // Clean up previous instance before creating a new one
      if (nostalgistRef.current) {
        try {
          nostalgistRef.current.exit({ removeCanvas: false });
        } catch {}
        nostalgistRef.current = null;
      }

      try {
        const { Nostalgist } = await import('nostalgist');
        if (isCancelled) return;

        setLoadingStatus(`Iniciando ${selectedCore === 'snes9x2010' ? 'SNES9x 2010' : 'SNES9x 2005'} (60 FPS)...`);

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Ensure absolute URL if given a relative path for ROM
        let romTarget: string | Blob = romSourceUrl;
        if (
          typeof romSourceUrl === 'string' &&
          !romSourceUrl.startsWith('http://') &&
          !romSourceUrl.startsWith('https://') &&
          !romSourceUrl.startsWith('blob:') &&
          !romSourceUrl.startsWith('data:')
        ) {
          romTarget = new URL(romSourceUrl, window.location.origin).href;
        }

        // Pre-fetch ROM as Blob for zero fetch failures inside Nostalgist
        let romData: Blob | string = romTarget;
        if (typeof romTarget === 'string' && !romTarget.startsWith('blob:') && !romTarget.startsWith('data:')) {
          setLoadingStatus('Carregando dados do cartucho...');
          try {
            let res = await fetch(romTarget);
            if (!res.ok) {
              const altUrl = romTarget.includes('/api/rom/')
                ? new URL(`/roms/${encodeURIComponent(fallbackGame.id)}.smc`, window.location.origin).href
                : new URL(`/api/rom/${encodeURIComponent(fallbackGame.id)}.smc`, window.location.origin).href;
              const altRes = await fetch(altUrl);
              if (altRes.ok) {
                res = altRes;
              }
            }
            if (res.ok) {
              const ct = res.headers.get('content-type') || '';
              if (!ct.includes('text/html')) {
                romData = await res.blob();
              }
            }
          } catch (fetchErr) {
            console.warn('Pre-fetch do cartucho avisou:', fetchErr);
          }
        }

        // Check magic bytes: if it starts with PK (0x50 0x4B 0x03 0x04), name it .zip so RetroArch's internal zip unpacker engages
        let romExt = 'smc';
        if (romData instanceof Blob) {
          try {
            const headerBytes = new Uint8Array(await romData.slice(0, 4).arrayBuffer());
            if (headerBytes[0] === 0x50 && headerBytes[1] === 0x4b && headerBytes[2] === 0x03 && headerBytes[3] === 0x04) {
              romExt = 'zip';
            }
          } catch {}
        }

        if (isCancelled) return;
        setLoadingStatus(`Iniciando ${selectedCore === 'snes9x2010' ? 'SNES9x 2010' : 'SNES9x 2005'} (60 FPS)...`);

        const instance = await Nostalgist.launch({
          core: selectedCore,
          rom: {
            fileName: `${fallbackGame.id}.${romExt}`,
            fileContent: romData,
          },
          element: canvas,
          size: 'auto',
          resolveCoreJs: (c) => `/cores/${c}_libretro.js`,
          resolveCoreWasm: (c) => `/cores/${c}_libretro.wasm`,
          retroarchConfig: {
            video_vsync: true,
            video_refresh_rate: 60.0,
            audio_sync: true,
            audio_rate_control: true,
            audio_rate_control_delta: 0.005,
            audio_max_timing_skew: 0.05,
            audio_latency: 96,
            audio_out_rate: 48000,
            video_smooth: false,
            rewind_enable: false,
            // Explicit button binding for zero-latency touch and keyboard controls
            input_player1_a: 'x',
            input_player1_b: 'z',
            input_player1_x: 's',
            input_player1_y: 'a',
            input_player1_l: 'q',
            input_player1_r: 'w',
            input_player1_start: 'enter',
            input_player1_select: 'rshift',
            input_player1_up: 'up',
            input_player1_down: 'down',
            input_player1_left: 'left',
            input_player1_right: 'right',
          },
          onLaunch: () => {
            if (!isCancelled) {
              setIsLoading(false);
            }
          },
        });

        if (isCancelled) {
          instance.exit({ removeCanvas: false });
          return;
        }

        nostalgistRef.current = instance;
        setIsLoading(false);
      } catch (err: any) {
        console.error('Falha ao iniciar Nostalgist.js:', err);
        if (!isCancelled) {
          setErrorMessage(err?.message || 'Falha ao carregar o emulador WebAssembly.');
          setIsLoading(false);
        }
      }
    };

    startEmulator();

    return () => {
      isCancelled = true;
      if (nostalgistRef.current) {
        try {
          nostalgistRef.current.exit({ removeCanvas: false });
        } catch {}
        nostalgistRef.current = null;
      }
    };
  }, [romSourceUrl, recoveryKey, selectedCore]);

  // Keep WebGL canvas smoothly sized on orientation changes or control toggling with debouncing
  useEffect(() => {
    let timeoutId: any = null;

    const triggerResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          if (nostalgistRef.current && canvasRef.current) {
            const rect = canvasRef.current.parentElement?.getBoundingClientRect();
            if (rect && rect.width > 0 && rect.height > 0) {
              nostalgistRef.current.resize({
                width: Math.floor(rect.width),
                height: Math.floor(rect.height),
              });
            }
          }
        } catch {}
      }, 150);
    };

    window.addEventListener('resize', triggerResize);
    window.addEventListener('orientationchange', triggerResize);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', triggerResize);
      window.removeEventListener('orientationchange', triggerResize);
    };
  }, [isLandscape, showControls]);

  // Zero-re-render direct input to Nostalgist / RetroArch
  const sendGamepadInput = useCallback(
    (btn: SnesButtonKey, pressed: boolean) => {
      if (Boolean(pressedStateRef.current[btn]) === pressed) return;
      pressedStateRef.current[btn] = pressed;

      // Update visual button active state directly in DOM (0 React re-renders)
      const root = padRootRef.current;
      if (root) {
        const nodes = root.querySelectorAll<HTMLElement>(`[data-pad-btn="${btn}"]`);
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].setAttribute('data-active', pressed ? 'true' : 'false');
        }
      }

      const nBtn = NOSTALGIST_BUTTON_MAP[btn];
      const emu = nostalgistRef.current;

      // Unlock AudioContext on first touch
      if (pressed) {
        unlockAudioContext();
      }

      // Direct programmatic button press/release into Nostalgist
      if (nBtn && emu) {
        try {
          if (pressed) {
            emu.pressDown(nBtn);
          } else {
            emu.pressUp(nBtn);
          }
        } catch {}
      }

      // Dispatch synthetic keyboard event to ensure full capture by RetroArch's Emscripten canvas listeners
      const meta = SNES_INPUTS[btn];
      if (meta && meta.code) {
        const evType = pressed ? 'keydown' : 'keyup';
        const keyEv = new KeyboardEvent(evType, {
          key: meta.key,
          code: meta.code,
          keyCode: meta.keyCode,
          which: meta.keyCode,
          bubbles: true,
          cancelable: true,
        });
        canvasRef.current?.dispatchEvent(keyEv);
        window.dispatchEvent(keyEv);
      }
    },
    [unlockAudioContext]
  );

  const handleSaveState = async () => {
    if (!nostalgistRef.current) return;
    try {
      showToast('💾 Salvando estado...');
      const res = await nostalgistRef.current.saveState();
      if (res && res.state) {
        await saveStateToIDB(fallbackGame.id, res.state);
        showToast('✅ Estado salvo com sucesso!');
      } else {
        showToast('⚠️ Falha ao obter dados do estado');
      }
    } catch (err) {
      console.error('Falha ao salvar estado:', err);
      showToast('❌ Erro ao salvar estado');
    }
  };

  const handleLoadState = async () => {
    if (!nostalgistRef.current) return;
    try {
      showToast('📂 Buscando estado...');
      const blob = await loadStateFromIDB(fallbackGame.id);
      if (!blob) {
        showToast('ℹ️ Nenhum save state encontrado');
        return;
      }
      await nostalgistRef.current.loadState(blob);
      showToast('✅ Estado carregado com sucesso!');
    } catch (err) {
      console.error('Falha ao carregar estado:', err);
      showToast('❌ Erro ao carregar estado');
    }
  };

  const handleRestart = () => {
    if (!nostalgistRef.current) {
      setRecoveryKey((k) => k + 1);
      return;
    }
    try {
      nostalgistRef.current.restart();
      showToast('🔄 Jogo reiniciado');
    } catch {
      setRecoveryKey((k) => k + 1);
    }
  };

  const handleClose = () => {
    try {
      nostalgistRef.current?.exit?.({ removeCanvas: false });
    } catch {}
    try {
      window.close();
    } catch {}
    setIsClosed(true);
  };

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
  const renderDpad = (sizeClass = 'w-32 h-32 sm:w-36 sm:h-36') => (
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
        className="absolute top-1 left-1/2 -translate-x-1/2 w-10 sm:w-11 h-10 sm:h-11 rounded-t-xl flex items-center justify-center font-bold text-sm sm:text-base border bg-[#13101f] text-gray-300 border-purple-500/30 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
      >
        ▲
      </div>
      <div
        data-pad-btn="DOWN"
        data-active="false"
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 sm:w-11 h-10 sm:h-11 rounded-b-xl flex items-center justify-center font-bold text-sm sm:text-base border bg-[#13101f] text-gray-300 border-purple-500/30 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
      >
        ▼
      </div>
      <div
        data-pad-btn="LEFT"
        data-active="false"
        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 sm:w-11 h-10 sm:h-11 rounded-l-xl flex items-center justify-center font-bold text-sm sm:text-base border bg-[#13101f] text-gray-300 border-purple-500/30 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
      >
        ◀
      </div>
      <div
        data-pad-btn="RIGHT"
        data-active="false"
        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 sm:w-11 h-10 sm:h-11 rounded-r-xl flex items-center justify-center font-bold text-sm sm:text-base border bg-[#13101f] text-gray-300 border-purple-500/30 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
      >
        ▶
      </div>
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#191528] border border-purple-500/20 z-10" />
    </div>
  );

  // Action Diamond (X, Y, A, B) reused in both Portrait and Landscape docks
  const renderActionButtons = (sizeClass = 'w-32 h-32 sm:w-36 sm:h-36') => (
    <div
      className={`relative ${sizeClass} rounded-full bg-[#221e35] border-2 border-purple-500/40 shadow-xl touch-none select-none shrink-0`}
    >
      {/* X (Top - Blue) */}
      <button
        type="button"
        {...bindButtonEvents('X')}
        className="absolute top-1 left-1/2 -translate-x-1/2 w-10 sm:w-11 h-10 sm:h-11 rounded-full font-extrabold text-xs sm:text-sm text-white border-2 shadow-md bg-blue-600 border-blue-300/60 data-[active=true]:bg-blue-400 data-[active=true]:border-white data-[active=true]:scale-90"
      >
        X
      </button>
      {/* Y (Left - Green) */}
      <button
        type="button"
        {...bindButtonEvents('Y')}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 sm:w-11 h-10 sm:h-11 rounded-full font-extrabold text-xs sm:text-sm text-white border-2 shadow-md bg-emerald-600 border-emerald-300/60 data-[active=true]:bg-emerald-400 data-[active=true]:border-white data-[active=true]:scale-90"
      >
        Y
      </button>
      {/* A (Right - Red) */}
      <button
        type="button"
        {...bindButtonEvents('A')}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 sm:w-11 h-10 sm:h-11 rounded-full font-extrabold text-xs sm:text-sm text-white border-2 shadow-md bg-rose-600 border-rose-300/60 data-[active=true]:bg-rose-400 data-[active=true]:border-white data-[active=true]:scale-90"
      >
        A
      </button>
      {/* B (Bottom - Yellow) */}
      <button
        type="button"
        {...bindButtonEvents('B')}
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 sm:w-11 h-10 sm:h-11 rounded-full font-extrabold text-xs sm:text-sm text-gray-950 border-2 shadow-md bg-amber-400 border-yellow-200/80 data-[active=true]:bg-yellow-300 data-[active=true]:border-white data-[active=true]:scale-90"
      >
        B
      </button>
    </div>
  );

  const isHandheldLandscape = isLandscape && showControls;

  return (
    <div
      ref={padRootRef}
      onPointerDownCapture={unlockAudioContext}
      className="fixed inset-0 w-screen h-[100dvh] bg-[#0b0914] text-white flex flex-col overflow-hidden select-none"
    >
      {/* Ultra-slim Top Console Bar */}
      <header className="h-10 px-3 bg-[#181527] border-b-2 border-black flex items-center justify-between gap-1.5 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={handleClose}
            className="retro-btn px-2.5 py-1 rounded-lg bg-[#3a1d28] hover:bg-rose-700 font-pixel text-[8px] text-rose-200 border-2 border-black flex items-center gap-1 shrink-0 retro-shadow-sm transition-all"
            title="Fechar jogo"
          >
            <span>✕</span>
            <span>FECHAR</span>
          </button>

          <h1 className="font-pixel text-[9px] sm:text-[10px] text-amber-400 truncate drop-shadow-[1px_1px_0_#000]">
            {fallbackGame.title}
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Core Switcher Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = selectedCore === 'snes9x2010' ? 'snes9x2005' : 'snes9x2010';
              setSelectedCore(next);
              showToast(`⚡ Núcleo: ${next === 'snes9x2010' ? 'SNES9x 2010' : 'SNES9x 2005'}`);
            }}
            className="retro-btn px-1.5 sm:px-2 py-1 rounded-lg bg-[#27233c] hover:bg-purple-700 font-pixel text-[8px] text-amber-300 border-2 border-black retro-shadow-sm transition-all"
            title="Alternar núcleo (SNES9X 2010 / 2005)"
          >
            ⚡ {selectedCore === 'snes9x2010' ? '2010' : '2005'}
          </button>

          {/* Save State */}
          <button
            type="button"
            onClick={handleSaveState}
            className="retro-btn px-1.5 sm:px-2 py-1 rounded-lg bg-[#27233c] hover:bg-[#342f4e] font-pixel text-[8px] text-gray-200 border-2 border-black retro-shadow-sm transition-all flex items-center gap-1"
            title="Salvar Estado (Save State)"
          >
            <span>💾</span>
            <span className="hidden md:inline">SALVAR</span>
          </button>

          {/* Load State */}
          <button
            type="button"
            onClick={handleLoadState}
            className="retro-btn px-1.5 sm:px-2 py-1 rounded-lg bg-[#27233c] hover:bg-[#342f4e] font-pixel text-[8px] text-gray-200 border-2 border-black retro-shadow-sm transition-all flex items-center gap-1"
            title="Carregar Estado (Load State)"
          >
            <span>📂</span>
            <span className="hidden md:inline">CARREGAR</span>
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={handleRestart}
            className="retro-btn px-1.5 sm:px-2 py-1 rounded-lg bg-[#27233c] hover:bg-[#342f4e] font-pixel text-[9px] text-gray-200 border-2 border-black retro-shadow-sm transition-all"
            title="Reiniciar Jogo"
          >
            🔄
          </button>

          {/* Controls Toggle */}
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            className={`retro-btn px-2 py-1 rounded-lg font-pixel text-[8px] border-2 border-black transition-all ${
              showControls
                ? 'bg-emerald-600 border-black text-white retro-shadow-sm'
                : 'bg-[#27233c] text-gray-400'
            }`}
          >
            🎮 {showControls ? 'PAD' : 'OFF'}
          </button>
        </div>
      </header>

      {/* Unified Console Body:
          Canvas is ALWAYS mounted in DOM so rotating the phone or toggling Pad ON/OFF never restarts emulation! */}
      <div
        className={`flex-1 min-h-0 w-full flex ${
          isHandheldLandscape ? 'flex-row items-stretch' : 'flex-col'
        } bg-[#09080f] overflow-hidden`}
      >
        {/* 1. Native Unobstructed 16-Bit WebAssembly Game Screen */}
        <div
          key="emulator-stage-host"
          ref={stageContainerRef}
          className={`clean-emulator-stage bg-black flex items-center justify-center relative overflow-hidden ${
            isHandheldLandscape
              ? 'order-2 flex-1 min-w-0 h-full'
              : showControls && isTouchDevice
                ? 'order-1 w-full h-[45dvh] sm:h-[50dvh] shrink-0 border-b-2 border-purple-500/40'
                : 'order-1 flex-1 min-h-0 w-full'
          }`}
        >
          <canvas
            ref={canvasRef}
            id="game-canvas"
            className="w-full h-full max-w-full max-h-full object-contain"
            style={{
              imageRendering: 'pixelated',
              aspectRatio: '4/3',
              transform: 'translateZ(0)',
              outline: 'none',
            }}
            tabIndex={0}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#0b0914]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-30 pointer-events-none">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-amber-400 animate-spin mb-4" />
              <p className="font-pixel text-[11px] text-amber-400 tracking-wider text-center drop-shadow-[1px_1px_0_#000] mb-2">
                CARTUCHOS ZONE
              </p>
              <p className="text-xs text-purple-200/90 text-center animate-pulse">
                {loadingStatus}
              </p>
            </div>
          )}

          {/* Error Overlay */}
          {errorMessage && (
            <div className="absolute inset-0 bg-red-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30 text-center">
              <p className="font-pixel text-xs text-rose-300 mb-2">ERRO AO INICIAR JOGO</p>
              <p className="text-xs text-gray-300 max-w-sm mb-4">{errorMessage}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setRecoveryKey((k) => k + 1)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-pixel text-[10px]"
                >
                  TENTAR NOVAMENTE
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCore((c) => (c === 'snes9x2010' ? 'snes9x2005' : 'snes9x2010'))
                  }
                  className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-pixel text-[10px]"
                >
                  MUDAR CORE ({selectedCore === 'snes9x2010' ? 'SNES9X 2005' : 'SNES9X 2010'})
                </button>
              </div>
            </div>
          )}

          {/* Retro Toast Message */}
          {toastMessage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1b172c]/95 border-2 border-purple-400/80 px-4 py-1.5 rounded-full text-xs font-pixel text-amber-300 shadow-xl z-40 animate-fade-in pointer-events-none">
              {toastMessage}
            </div>
          )}
        </div>

        {/* 2. Controller Grips / Deck */}
        {isHandheldLandscape ? (
          <>
            {/* Left Controller Grip (order-1) */}
            <div className="order-1 w-40 sm:w-48 bg-gradient-to-b from-[#1b172c] to-[#120f1d] border-r border-purple-500/30 p-2.5 pb-16 sm:pb-20 flex flex-col items-center justify-between shrink-0 touch-none select-none">
              <button
                type="button"
                {...bindButtonEvents('L')}
                className="w-full h-9 rounded-t-xl rounded-b-md font-extrabold text-xs tracking-widest border-2 bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
              >
                L
              </button>

              {renderDpad('w-32 h-32')}

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  {...bindButtonEvents('SELECT')}
                  className="px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 shadow-md"
                >
                  Select
                </button>
                <span className="text-[7px] font-pixel text-purple-300/60">SELECT</span>
              </div>
            </div>

            {/* Right Controller Grip (order-3) */}
            <div className="order-3 w-40 sm:w-48 bg-gradient-to-b from-[#1b172c] to-[#120f1d] border-l border-purple-500/30 p-2.5 pb-16 sm:pb-20 flex flex-col items-center justify-between shrink-0 touch-none select-none">
              <button
                type="button"
                {...bindButtonEvents('R')}
                className="w-full h-9 rounded-t-xl rounded-b-md font-extrabold text-xs tracking-widest border-2 bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200"
              >
                R
              </button>

              {renderActionButtons('w-32 h-32')}

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  {...bindButtonEvents('START')}
                  className="px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 shadow-md"
                >
                  Start
                </button>
                <span className="text-[7px] font-pixel text-purple-300/60">START</span>
              </div>
            </div>
          </>
        ) : (
          showControls && (
            /* Portrait Bottom Dedicated SNES Physical Gamepad Deck (order-2) */
            <div className="order-2 flex-1 min-h-0 w-full bg-gradient-to-b from-[#1c182c] to-[#110e1b] px-3 sm:px-4 pt-2.5 pb-8 sm:pb-10 flex flex-col justify-between touch-none select-none">
              {/* Top Row: L & R Shoulder Buttons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  {...bindButtonEvents('L')}
                  className="w-24 sm:w-28 h-9 sm:h-10 rounded-t-2xl rounded-b-lg font-extrabold text-xs sm:text-sm tracking-widest border-2 shadow-md bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 data-[active=true]:scale-95"
                >
                  L
                </button>

                <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase text-purple-300/60">
                  SUPER NINTENDO
                </span>

                <button
                  type="button"
                  {...bindButtonEvents('R')}
                  className="w-24 sm:w-28 h-9 sm:h-10 rounded-t-2xl rounded-b-lg font-extrabold text-xs sm:text-sm tracking-widest border-2 shadow-md bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 data-[active=true]:scale-95"
                >
                  R
                </button>
              </div>

              {/* Middle Row: D-Pad (Left), Center-Elevated SELECT & START (Thumb-level), Action Buttons (Right) */}
              <div className="flex items-center justify-between gap-1 sm:gap-2 my-auto px-1">
                {renderDpad('w-32 h-32 sm:w-36 sm:h-36')}

                {/* Center Elevated SELECT & START: Sits high, authentic 16-bit SNES angled pill layout */}
                <div className="flex flex-col items-center justify-center gap-2 px-1">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        {...bindButtonEvents('SELECT')}
                        className="w-11 sm:w-12 h-6 sm:h-7 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shadow-md bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 data-[active=true]:scale-95 -rotate-25 transition-transform"
                      >
                        Select
                      </button>
                      <span className="text-[7px] font-pixel text-purple-300/70 tracking-tighter">SELECT</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        {...bindButtonEvents('START')}
                        className="w-11 sm:w-12 h-6 sm:h-7 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shadow-md bg-[#2a2440] text-gray-200 border-purple-400/40 data-[active=true]:bg-amber-400 data-[active=true]:text-gray-950 data-[active=true]:border-amber-200 data-[active=true]:scale-95 -rotate-25 transition-transform"
                      >
                        Start
                      </button>
                      <span className="text-[7px] font-pixel text-purple-300/70 tracking-tighter">START</span>
                    </div>
                  </div>
                </div>

                {renderActionButtons('w-32 h-32 sm:w-36 sm:h-36')}
              </div>

              {/* Bottom Safe Zone: Guarantees full clearance from Netlify badge and phone gesture pill */}
              <div className="h-6 sm:h-8 shrink-0" />
            </div>
          )
        )}
      </div>

      {/* Screen Closed Overlay */}
      {isClosed && (
        <div className="fixed inset-0 z-50 bg-[#090812] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[#1b1528] border-2 border-purple-500/40 flex items-center justify-center text-3xl mb-4 shadow-xl">
            🎮
          </div>
          <h2 className="font-pixel text-sm sm:text-base text-amber-400 mb-2 drop-shadow-[1px_1px_0_#000]">
            JOGO FINALIZADO
          </h2>
          <p className="text-xs text-gray-400 max-w-xs mb-6">
            A sessão foi encerrada. Você já pode fechar esta aba no seu navegador.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsClosed(false);
              setRecoveryKey((k) => k + 1);
            }}
            className="retro-btn px-4 py-2 rounded-lg bg-[#27233c] hover:bg-purple-600 font-pixel text-[9px] text-gray-200 border-2 border-black shadow-md transition-all flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>JOGAR NOVAMENTE</span>
          </button>
        </div>
      )}
    </div>
  );
}
