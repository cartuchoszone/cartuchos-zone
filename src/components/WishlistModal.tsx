'use client';

import React, { useState } from 'react';
import { saveWishlistRequest } from '@/lib/storage';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistModal({ isOpen, onClose }: WishlistModalProps) {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('SNES');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    saveWishlistRequest(title.trim(), platform, notes.trim());
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTitle('');
      setNotes('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#1c192b] border border-purple-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-4">
          <h3 className="text-base font-extrabold text-amber-400">
            ✨ Enviar Lista de Desejos de Jogos
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <p className="font-bold text-emerald-400">Pedido registrado com sucesso!</p>
            <p className="text-xs text-gray-400">
              Obrigado por sugerir novos cartuchos para o catálogo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Nome do Jogo Desejado *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Top Gear 3000, International Superstar Soccer Deluxe..."
                className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Console / Plataforma
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="SNES">Super Nintendo (SNES)</option>
                <option value="NES">Nintendo 8-Bit (NES)</option>
                <option value="Genesis">Sega Genesis / Mega Drive</option>
                <option value="GBA">Game Boy Advance (GBA)</option>
                <option value="N64">Nintendo 64</option>
                <option value="PS1">PlayStation 1</option>
                <option value="Arcade">Arcade</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Observações / Versão ou Tradução
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma versão específica, ROM Hack ou tradução PT-BR?"
                className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-xs"
              >
                Enviar Sugestão
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
