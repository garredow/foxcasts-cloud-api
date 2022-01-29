export type Episode = {
  id: number;
  podcastId: number;
  date: number;
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
  episodeType?: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
};
