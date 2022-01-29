import { Soundbite } from './Soundbite';

export type Episode = {
  podexId: number;
  podcastPodexId: number;
  guid: string;
  date: string; // ISO 8601
  title: string;
  description?: string;
  duration: number;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  chaptersUrl?: string;
  transcriptUrl?: string;
  season?: number;
  episode?: number;
  episodeType?: 'full' | 'trailer' | 'bonus' | string;
  soundbite?: Soundbite;
  soundbites?: Soundbite[];
  imageUrl?: string;
};
