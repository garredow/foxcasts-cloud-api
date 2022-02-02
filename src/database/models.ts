export type DbCategory = {
  id: number;
  name: string;
  created_at: number;
  updated_at: number;
};

export type DbEpisode = {
  id: number;
  podcast_id: number;
  date: number;
  title: string;
  description?: string;
  duration: number;
  file_size: number;
  file_type: string;
  file_url: string;
  chapters_url?: string;
  transcript_url?: string;
  season?: number;
  episode?: number;
  episode_type?: string;
  image_url?: string;
  created_at: number;
  updated_at: number;
};

export type DbPodcast = {
  id: number;
  itunes_id?: number;
  title: string;
  author: string;
  description?: string;
  artwork_url: string;
  feed_url: string;
  categories?: number[];
  last_fetched_episodes: number;
  created_at: number;
  updated_at: number;
};

export type DbUser = {
  id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  created_at: number;
  updated_at: number;
};

export type DbSubscription = {
  user_id: string;
  podcast_id: number;
  created_at: number;
  updated_at: number;
};

export type DbProgress = {
  user_id: string;
  episode_id: number;
  current_time: number;
  created_at: number;
  updated_at: number;
};
