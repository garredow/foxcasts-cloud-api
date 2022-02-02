import PodcastIndexClient from 'podcastdx-client';
import { Database } from '../database/db';
import { config } from '../lib/config';
import { Episode, Podcast, SearchResult, User } from '../models';
import { toSearchResult } from '../utils/mappers';

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

  async getUserById(id: string): Promise<User> {
    return this.db.addUser({ id });
  }

  async subscribe(userId: string, podcastId: number): Promise<number> {
    return this.db.addSubscription(userId, podcastId);
  }

  async unsubscribe(userId: string, podcastId: number): Promise<number> {
    return this.db.deleteSubscription(userId, podcastId);
  }

  async checkIfSubscribed(userId: string, podcastId: number): Promise<boolean> {
    const sub = this.db.getSubscription(userId, podcastId);
    return !!sub;
  }

  async search(query: string, count = 30) {
    const result: SearchResult[] = await this.podcastIndex
      .search(query, { max: count })
      .then((res) => res.feeds.map((a) => toSearchResult(a)));

    return result;
  }

  async getPodcast(podexId: number) {
    const existing = await this.db.getPodcastById(podexId);
    if (existing) {
      return existing;
    }

    const res = await this.podcastIndex.podcastById(podexId);
    return this.db.addPodcast(res.feed);
  }

  async getPodcastsByIds(ids: number[]): Promise<Podcast[]> {
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
  }

  async getPodcastsByUserId(userId: string): Promise<Podcast[]> {
    const podcastIds = await this.db
      .getSubscriptionsByUserId(userId)
      .then((res) => res.map((a) => a.podcastId));

    return this.getPodcastsByIds(podcastIds);
  }

  async getEpisode(podexId: number) {
    const existing = await this.db.getEpisodeById(podexId);
    if (existing) {
      return existing;
    }

    const res = await this.podcastIndex.episodeById(podexId);
    return this.db.addEpisode(res.episode);
  }

  getEpisodeProgress(userId: string, episodeId: number): Promise<number> {
    return this.db.getEpisodeProgress(userId, episodeId);
  }

  setEpisodeProgress(userId: string, episodeId: number, progress: number): Promise<boolean> {
    return this.db.setEpisodeProgress(userId, episodeId, progress);
  }

  async getRecentEpisodes(podcastId: number, count = 20): Promise<Episode[]> {
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
  }
}
