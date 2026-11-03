import rawCatalog from '@/data/catalog.json';
import { SITE_CONFIG } from '@/config/site';
import type { CatalogData, Game, SidebarData } from '@/types/game';

const catalog = rawCatalog as CatalogData;

export const GENRE_PT_MAP: Record<string, string> = {
  'Platformer': 'Plataforma',
  'RPG': 'RPG',
  'Action': 'Ação',
  'Fighting': 'Luta',
  'Action-Adventure': 'Ação-aventura',
  "Beat 'em up": 'Luta corpo a corpo',
  'Racing': 'Corrida',
  'Action Platformer': 'Plataforma de ação',
  'Sports': 'Esportes',
  "Shoot 'em up": "Shoot 'em up",
  'Puzzle': 'Quebra-cabeça',
  'Strategy': 'Estratégia',
  'Simulation': 'Simulação',
  'Adventure': 'Aventura',
  'Run and Gun': 'Correr e atirar',
  'Tactical RPG': 'RPG tático',
  'Action RPG': 'RPG de ação',
  'Shooter': 'Tiro',
  'Pinball': 'Pinball',
  'Board Game': 'Jogo de tabuleiro',
  'Educational': 'Educativo',
  'Survival Horror': 'Survival Horror',
  'Arcade': 'Arcade',
  'Card Battle': 'Batalha de cartas',
  'Visual Novel': 'Visual Novel',
  'Rhythm': 'Ritmo',
  'Fighting / Action': 'Luta / Ação',
  'Puzzle Platformer': 'Plataforma de quebra-cabeça',
  'Stealth': 'Furtividade',
  'Compilation': 'Coletânea',
  'Traditional': 'Tradicional',
};

export const DEFAULT_SNES_CONTROLS: Record<string, string> = {
  'Setas (← ↑ → ↓)': 'Mover / Direcional (D-Pad)',
  'Z (Botão B)': 'Pular / Confirmar / Ação Secundária',
  'X (Botão A)': 'Ataque Especial / Ação Principal',
  'A (Botão Y)': 'Correr / Atirar / Ataque Rápido',
  'S (Botão X)': 'Menu Secundário / Trocar Item',
  'Q (Botão L)': 'Ombro Esquerdo / Mirar Diagonal Acima',
  'W (Botão R)': 'Ombro Direito / Mirar Diagonal Abaixo',
  'Enter (Start)': 'Pausar / Iniciar Jogo',
  'Shift Direito (Select)': 'Selecionar / Mapa / Opções',
};

export function translateGenre(genre: string): string {
  return GENRE_PT_MAP[genre] || genre;
}

export function translatePlatformName(platform: string): string {
  if (platform === 'SNES') return 'Super Nintendo';
  return platform;
}

export function resolveCoverUrl(imageUrl: string): string {
  if (!imageUrl) return 'https://classicgamezone.com/games/covers/snes/super-metroid.jpg';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  return `${SITE_CONFIG.remoteAssetOrigin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export function resolveRomUrl(game: Game): string {
  if (game.romUrl) {
    if (
      game.romUrl.startsWith('http://') ||
      game.romUrl.startsWith('https://') ||
      game.romUrl.startsWith('blob:') ||
      game.romUrl.startsWith('data:')
    ) {
      return game.romUrl;
    }
  }
  return `/api/rom/${encodeURIComponent(game.id)}`;
}

export function getAllCatalogGames(): Game[] {
  return catalog.allGames;
}

export function getSidebarData(): SidebarData {
  return catalog.sidebar;
}

export function getUniqueGenres(games: Game[]): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const g of games) {
    if (!g.genre) continue;
    counts.set(g.genre, (counts.get(g.genre) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: translateGenre(value),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt'));
}

export function getUniqueYears(games: Game[]): number[] {
  const years = new Set<number>();
  for (const g of games) {
    if (g.year) years.add(Number(g.year));
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function getGameById(id: string): Game | undefined {
  return catalog.allGames.find((g) => g.id === id);
}

export function getRelatedGames(game: Game, limit = 6): Game[] {
  const sameSeries = catalog.allGames.filter(
    (g) =>
      g.id !== game.id &&
      ((game.series && g.series === game.series) || (game.enSeries && g.enSeries === game.enSeries))
  );
  const sameGenre = catalog.allGames.filter(
    (g) => g.id !== game.id && g.genre === game.genre && !sameSeries.some((s) => s.id === g.id)
  );
  return [...sameSeries, ...sameGenre].slice(0, limit);
}

export function inferDeveloper(game: Game): string {
  if (game.developer) return game.developer;
  if (game.isHack) return 'Comunidade ROM Hacking (Fan-Made)';
  const s = (game.enSeries || game.series || game.title).toLowerCase();
  if (s.includes('mario') || s.includes('zelda') || s.includes('metroid') || s.includes('star fox') || s.includes('f-zero')) {
    return 'Nintendo EAD / R&D1';
  }
  if (s.includes('donkey kong')) return 'Rare / Nintendo';
  if (s.includes('mega man') || s.includes('street fighter') || s.includes('final fight') || s.includes('breath of fire')) {
    return 'Capcom';
  }
  if (s.includes('chrono') || s.includes('final fantasy') || s.includes('mana')) return 'Square (SquareSoft)';
  if (s.includes('dragon quest') || s.includes('illusion') || s.includes('terranigma')) return 'Enix / Quintet';
  if (s.includes('castlevania') || s.includes('contra') || s.includes('tmnt') || s.includes('tartarugas')) return 'Konami';
  if (s.includes('kirby')) return 'HAL Laboratory';
  if (s.includes('mortal kombat')) return 'Midway / Sculptured Software';
  if (s.includes('bomberman')) return 'Hudson Soft';
  if (s.includes('sonic')) return 'Sega / Aspect';
  return 'Nintendo / Third-Party Licenciada';
}

export function getLongDescription(game: Game): string[] {
  if (game.longDescription && game.longDescription.length > 0) {
    return game.longDescription;
  }
  const paragraphs = [game.description];
  if (game.isHack) {
    paragraphs.push(
      `Este título é um ROM Hack de Super Nintendo (${game.year}), criado pela comunidade sobre a arquitetura 16-bit original do console. Ele traz fases inéditas, balanceamento refinado e novos desafios mantendo a fidelidade de resposta e áudio SPC700 do hardware real.`
    );
  } else {
    paragraphs.push(
      `Lançado originalmente em ${game.year} para o Super Nintendo Entertainment System (SNES), ${game.title} destaca-se no gênero ${translateGenre(game.genre)} pelo uso expressivo da paleta de 32.768 cores, rolagem em múltiplas camadas de parallax e trilha sonora composta para o chip Sony SPC700.`
    );
  }
  paragraphs.push(
    `Você pode jogar ${game.title} diretamente no navegador usando nosso emulador EmulatorJS integrado (com suporte a Save State, tela cheia e controles configuráveis no teclado ou gamepad USB/Bluetooth) ou carregar sua própria ROM (.sfc, .smc ou .zip) a qualquer momento.`
  );
  return paragraphs;
}
