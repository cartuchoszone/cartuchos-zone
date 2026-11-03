export interface Game {
  id: string;
  title: string;
  platform: string;
  genre: string;
  year: number;
  description: string;
  series?: string;
  enSeries?: string;
  imageUrl: string;
  isHack?: boolean;
  developer?: string;
  publisher?: string;
  romUrl?: string;
  isCustom?: boolean;
  longDescription?: string[];
  controls?: Record<string, string>;
}

export interface PlatformItem {
  id: string;
  name: string;
  count: number;
  type: string;
}

export interface GenreItem {
  name: string;
  count: number;
  slug: string;
}

export interface SeriesItem {
  name: string;
  enName: string;
  count: number;
  platforms: string[];
  years: number[];
}

export interface TagItem {
  name: string;
  count: number;
}

export interface SidebarData {
  platforms: PlatformItem[];
  genres: GenreItem[];
  series: SeriesItem[];
  tags: TagItem[];
}

export interface CatalogData {
  platform: string;
  allGames: Game[];
  sidebar: SidebarData;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}
