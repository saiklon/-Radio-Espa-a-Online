export interface RadioStation {
  id: string;
  name: string;
  category: 'Popular' | 'Música' | 'Noticias' | 'Deportes' | 'Nicho' | 'Regional';
  streamUrl: string;
  logoUrl: string;
  description: string;
  color?: string;
}

export interface PlayerState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
}
