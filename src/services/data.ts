import PodcastIndexClient from 'podcastdx-client';
import { config } from '../lib/config';
import { SearchResult } from '../models';
import { toEpisode, toPodcast, toSearchResult } from '../utils/mappers';

export class Data {
  podcastIndex: PodcastIndexClient;

  constructor() {
    this.podcastIndex = new PodcastIndexClient({
      key: config.podcastIndex.apiKey,
      secret: config.podcastIndex.apiSecret,
      disableAnalytics: true,
    });
  }

  async search(query: string, count = 30) {
    const result: SearchResult[] = await this.podcastIndex
      .search(query, { max: count })
      .then((res) => res.feeds.map((a) => toSearchResult(a)));

    return result;
  }

  async getPodcast(podexId: number) {
    const podcast = await this.podcastIndex.podcastById(podexId);
    return toPodcast(podcast.feed);
  }

  async getEpisode(podexId: number) {
    const res = await this.podcastIndex.episodeById(podexId);
    return toEpisode(res.episode);
  }

  async getRecentEpisodes(podexId: number, count = 0) {
    return this.podcastIndex
      .episodesByFeedId(podexId, { max: count })
      .then((res) => res.items.map((a) => toEpisode(a)));
  }
}
