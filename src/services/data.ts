import fetch from 'node-fetch';
import Vibrant from 'node-vibrant';
import PodcastIndexClient from 'podcastdx-client';
import sharp from 'sharp';
import { Database } from '../database/db';
import { config } from '../lib/config';
import { Episode, Health, Palette, Podcast, SearchResult, User } from '../models';
import { toSearchResult } from '../utils/mappers';
const { version: apiVersion } = require('../../package.json');

export class Data {
  db: Database;
  podcastIndex: PodcastIndexClient;

  constructor(db?: Database) {
    this.db = db ?? new Database();
    this.podcastIndex = new PodcastIndexClient({
      key: config.podcastIndex.apiKey,
      secret: config.podcastIndex.apiSecret,
      disableAnalytics: true,
    });
  }

  artwork = {
    getUrl: async (podcastId: number): Promise<string | undefined> => {
      const podcast = await this.db.getPodcastById(podcastId);
      return podcast?.artworkUrl;
    },
    getImageData: async (
      podcastId: number,
      size: number,
      blur: number
    ): Promise<string | undefined> => {
      const podcast = await this.podcast.getById(podcastId);
      if (!podcast || !podcast.artworkUrl) return;

      const image = await fetch(podcast.artworkUrl).then((res) => res.buffer());
      const artwork = sharp(image).resize(size);
      if (blur > 0) {
        artwork.blur(blur);
      }
      const result = await artwork.png().toBuffer();
      return `data:image/png;base64,${await result.toString('base64')}`;
    },
    getPalette: async (podcastId: number): Promise<Palette | undefined> => {
      const existing = await this.db.getPaletteByPodcastId(podcastId);
      if (existing) return existing;

      const podcast = await this.podcast.getById(podcastId);
      if (!podcast) return;

      const image = await fetch(podcast.artworkUrl).then((res) => res.buffer());
      const palette = await Vibrant.from(image).getPalette();

      const result = {
        darkMuted: palette.DarkMuted?.hex,
        darkVibrant: palette.DarkVibrant?.hex,
        lightMuted: palette.LightMuted?.hex,
        lightVibrant: palette.LightVibrant?.hex,
        muted: palette.Muted?.hex,
        vibrant: palette.Vibrant?.hex,
      };

      await this.db.addPalette(podcastId, result);

      return result;
    },
  };

  episode = {
    getById: async (id: number): Promise<Episode | undefined> => {
      const existing = await this.db.getEpisodeById(id);
      if (existing) {
        return existing;
      }

      const res = await this.podcastIndex.episodeById(id);
      return this.db.addEpisode(res.episode);
    },
    getUserProgress: (userId: string, episodeId: number): Promise<number> => {
      return this.db.getEpisodeProgress(userId, episodeId);
    },
    setUserProgress: (userId: string, episodeId: number, progress: number): Promise<boolean> => {
      return this.db.setEpisodeProgress(userId, episodeId, progress);
    },
    getRecent: async (podcastId: number, count = 20): Promise<Episode[]> => {
      const [podcast, episodes] = await Promise.all([
        this.db.getPodcastById(podcastId),
        this.db.getEpisodesByPodcastId(podcastId),
      ]);
      if (!podcast) return [];

      const isStale = (podcast.lastFetchedEpisodes ?? 0) + config.caching.dataStaleMs < Date.now();
      if (!isStale && episodes.length > 0) {
        return episodes;
      }

      const res = await this.podcastIndex.episodesByFeedId(podcastId, { max: count });
      await this.db.addEpisodes(res.items);

      return this.db.getEpisodesByPodcastId(podcastId);
    },
  };

  podcast = {
    search: (query: string, count = 30): Promise<SearchResult[]> => {
      return this.podcastIndex
        .search(query, { max: count })
        .then((res) => res.feeds.map((a) => toSearchResult(a)));
    },
    getById: async (id: number): Promise<Podcast | undefined> => {
      const existing = await this.db.getPodcastById(id);
      if (existing) {
        return existing;
      }

      const res = await this.podcastIndex.podcastById(id);
      return this.db.addPodcast(res.feed);
    },
    getByIds: async (ids: number[]): Promise<Podcast[]> => {
      const dbPodcasts = await this.db.getPodcastsByIds(ids);

      const dbIds = dbPodcasts.map((a) => a.id);
      const otherIds = ids.filter((a) => !dbIds.includes(a));

      if (otherIds.length > 0) {
        for (const id of otherIds) {
          const piRes = await this.podcastIndex.podcastById(id);
          const res = await this.db.addPodcast(piRes.feed);
          dbPodcasts.push(res);
        }
      }

      return dbPodcasts;
    },
    getByUserId: async (userId: string): Promise<Podcast[]> => {
      const podcastIds = await this.db
        .getSubscriptionsByUserId(userId)
        .then((res) => res.map((a) => a.podcastId));

      return this.podcast.getByIds(podcastIds);
    },
    subscribe: async (userId: string, podcastId: number): Promise<boolean> => {
      await this.db.addSubscription(userId, podcastId);
      return true;
    },
    unsubscribe: async (userId: string, podcastId: number): Promise<boolean> => {
      await this.db.deleteSubscription(userId, podcastId);
      return true;
    },
    checkIfSubscribed: async (userId: string, podcastId: number): Promise<boolean> => {
      const sub = this.db.getSubscription(userId, podcastId);
      return !!sub;
    },
  };

  user = {
    getById: (id: string): Promise<User> => {
      return this.db.addUser({ id });
    },
  };

  meta = {
    health: async (): Promise<Health> => {
      return {
        version: apiVersion,
        uptime: Math.floor(process.uptime() * 1000),
        date: new Date().toUTCString(),
        databaseLatency: await this.db.testLatency(),
      };
    },
  };
}
