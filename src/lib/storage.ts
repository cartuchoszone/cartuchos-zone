'use client';

import type { Game, ReviewItem } from '@/types/game';

const FAV_KEY = 'cartuchos_favorites_v1';
const LIKES_KEY = 'cartuchos_likes_v1';
const RECENT_KEY = 'cartuchos_recent_v1';
const CUSTOM_GAMES_KEY = 'cartuchos_custom_games_v1';
const WISHLIST_KEY = 'cartuchos_wishlist_v1';

// IndexedDB for storing uploaded ROM binary files (.sfc / .smc / .zip)
const DB_NAME = 'CartuchosRomDB';
const STORE_NAME = 'roms';

function openRomDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('states')) {
        db.createObjectStore('states');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveStateToIDB(gameId: string, stateBlob: Blob): Promise<void> {
  const db = await openRomDB();
  const buffer = await stateBlob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('states', 'readwrite');
    tx.objectStore('states').put({ buffer, savedAt: Date.now() }, gameId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadStateFromIDB(gameId: string): Promise<Blob | null> {
  try {
    const db = await openRomDB();
    return new Promise((resolve) => {
      const tx = db.transaction('states', 'readonly');
      const req = tx.objectStore('states').get(gameId);
      req.onsuccess = () => {
        if (req.result && req.result.buffer) {
          resolve(new Blob([req.result.buffer]));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveRomBlobToIDB(gameId: string, file: Blob, fileName: string): Promise<void> {
  const db = await openRomDB();
  const buffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ buffer, fileName, type: file.type || 'application/octet-stream' }, gameId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadRomBlobUrlFromIDB(gameId: string): Promise<{ url: string; fileName: string } | null> {
  try {
    const db = await openRomDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(gameId);
      req.onsuccess = () => {
        if (req.result && req.result.buffer) {
          const blob = new Blob([req.result.buffer], { type: req.result.type || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          resolve({ url, fileName: req.result.fileName || `${gameId}.smc` });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function getFavoriteIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleFavoriteId(gameId: string): { favorites: string[]; isFavorite: boolean } {
  const current = getFavoriteIds();
  const exists = current.includes(gameId);
  const next = exists ? current.filter((id) => id !== gameId) : [gameId, ...current];
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('cartuchos:favorites-updated'));
  return { favorites: next, isFavorite: !exists };
}

export function getRecentIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentId(gameId: string): void {
  if (typeof window === 'undefined') return;
  const current = getRecentIds().filter((id) => id !== gameId);
  const next = [gameId, ...current].slice(0, 18);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function getGameLikeState(gameId: string): { liked: boolean; bonusCount: number } {
  if (typeof window === 'undefined') return { liked: false, bonusCount: 0 };
  try {
    const map = JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
    return map[gameId] || { liked: false, bonusCount: 0 };
  } catch {
    return { liked: false, bonusCount: 0 };
  }
}

export function toggleGameLike(gameId: string): { liked: boolean; bonusCount: number } {
  if (typeof window === 'undefined') return { liked: false, bonusCount: 0 };
  try {
    const map = JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
    const prev = map[gameId] || { liked: false, bonusCount: 0 };
    const next = {
      liked: !prev.liked,
      bonusCount: !prev.liked ? 1 : 0,
    };
    map[gameId] = next;
    localStorage.setItem(LIKES_KEY, JSON.stringify(map));
    return next;
  } catch {
    return { liked: false, bonusCount: 0 };
  }
}

export function getCustomGames(): Game[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_GAMES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCustomGame(game: Game): Game[] {
  const current = getCustomGames().filter((g) => g.id !== game.id);
  const next = [{ ...game, isCustom: true }, ...current];
  localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('cartuchos:custom-games-updated'));
  return next;
}

export function deleteCustomGame(gameId: string): Game[] {
  const next = getCustomGames().filter((g) => g.id !== gameId);
  localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('cartuchos:custom-games-updated'));
  return next;
}

export function getGameReviews(gameId: string): ReviewItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(`cartuchos_reviews_${gameId}`);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [
    {
      id: 'default-1',
      author: 'RetroPlayer_16Bit',
      rating: 5,
      comment: 'Clássico absoluto do Super Nintendo! A emulação está rodando liso a 60fps com áudio perfeito.',
      date: '2026-10-15',
    },
    {
      id: 'default-2',
      author: 'SnesCollectorBR',
      rating: 5,
      comment: 'Muito prático poder salvar o estado (Save State) direto no navegador ou carregar minha própria ROM traduzida PT-BR!',
      date: '2026-10-28',
    },
  ];
}

export function addGameReview(gameId: string, author: string, rating: number, comment: string): ReviewItem[] {
  const current = getGameReviews(gameId);
  const newReview: ReviewItem = {
    id: `rev-${Date.now()}`,
    author: author.trim() || 'Jogador Anônimo',
    rating,
    comment: comment.trim(),
    date: new Date().toISOString().slice(0, 10),
  };
  const next = [newReview, ...current];
  localStorage.setItem(`cartuchos_reviews_${gameId}`, JSON.stringify(next));
  return next;
}

export function saveWishlistRequest(title: string, platform: string, notes: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    list.unshift({ title, platform, notes, createdAt: new Date().toISOString() });
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
