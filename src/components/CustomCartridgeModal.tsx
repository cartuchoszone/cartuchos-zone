'use client';

import React, { useState } from 'react';
import type { Game } from '@/types/game';
import { GENRE_PT_MAP } from '@/lib/catalog';
import { saveCustomGame, saveRomBlobToIDB } from '@/lib/storage';

interface CustomCartridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newGame: Game) => void;
}

export default function CustomCartridgeModal({
  isOpen,
  onClose,
  onCreated,
}: CustomCartridgeModalProps) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Platformer');
  const [year, setYear] = useState('1994');
  const [series, setSeries] = useState('');
  const [isHack, setIsHack] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [romFile, setRomFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const slug =
        title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `custom-${Date.now()}`;

      const gameId = `custom-${slug}-${Date.now().toString().slice(-4)}`;

      if (romFile) {
        await saveRomBlobToIDB(gameId, romFile, romFile.name);
      }

      const newGame: Game = {
        id: gameId,
        title: title.trim(),
        platform: 'SNES',
        genre,
        year: Number(year) || 1994,
        series: series.trim() || undefined,
        enSeries: series.trim() || undefined,
        isHack,
        isCustom: true,
        imageUrl:
          imageUrl.trim() ||
          'https://classicgamezone.com/games/covers/snes/super-mario-world.jpg',
        description:
          description.trim() ||
          `Cartucho personalizado de Super Nintendo (${title.trim()}) adicionado à sua coleção local.`,
      };

      saveCustomGame(newGame);
      onCreated(newGame);
      onClose();
      setTitle('');
      setSeries('');
      setDescription('');
      setImageUrl('');
      setRomFile(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1c192b] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-white relative my-8">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🕹️</span>
            <div>
              <h3 className="text-lg font-extrabold text-amber-400">
                Criar / Inserir Novo Cartucho SNES
              </h3>
              <p className="text-xs text-gray-400">
                Adicione seu próprio jogo ou ROM (.sfc, .smc, .zip) ao catálogo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Título do Jogo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Chrono Trigger PT-BR"
                className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Gênero
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
              >
                {Object.entries(GENRE_PT_MAP).map(([en, pt]) => (
                  <option key={en} value={en}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Ano de Lançamento
              </label>
              <input
                type="number"
                min={1985}
                max={2030}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Série / Franquia
              </label>
              <input
                type="text"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="Ex: Super Mario, Zelda..."
                className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isHack}
                  onChange={(e) => setIsHack(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded"
                />
                <span className="text-xs font-semibold text-amber-300">
                  É um ROM Hack / Mod?
                </span>
              </label>
            </div>
          </div>

          {/* ROM File Upload */}
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-dashed border-purple-400/40">
            <label className="block text-xs font-bold text-amber-300 mb-1">
              📦 Arquivo ROM do Cartucho (.sfc, .smc, .zip) — Opcional
            </label>
            <input
              type="file"
              accept=".sfc,.smc,.zip,.fig,.swc"
              onChange={(e) => setRomFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-gray-950 hover:file:bg-amber-300"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              A ROM fica salva localmente no seu navegador (IndexedDB) pronta para rodar no emulador embutido!
            </p>
          </div>

          {/* Cover Image URL or Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                URL da Capa (Opcional)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... ou envie ao lado"
                className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Ou Enviar Imagem da Capa
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverFile}
                className="block w-full text-xs text-gray-300 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Descrição do Jogo
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a história, melhorias ou detalhes deste cartucho..."
              className="w-full px-3 py-2 rounded-lg bg-[#12101b] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-xs shadow-lg"
            >
              {saving ? 'Salvando Cartucho...' : 'Salvar e Adicionar à Coleção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
