import { IResolvers } from 'mercurius';
import { Data } from '../services/data';

export const resolvers: IResolvers = {
  Query: {
    search(root, { query, count }, ctx, info) {
      const client = new Data();
      return client.search(query, count ?? undefined);
    },
    async podcast(root, { podexId }, ctx, info) {
      const client = new Data();
      const res = await client.getPodcast(podexId);
      return res;
    },
    async episode(root, { podexId }, ctx, info) {
      const client = new Data();
      const res = await client.getEpisode(podexId);
      return res;
    },
  },
  Podcast: {
    episodes(podcast, { count }, ctx, info) {
      const client = new Data();
      return count > 0 ? client.getRecentEpisodes(podcast.podexId, count) : [];
    },
  },
  Episode: {
    podcast(episode) {
      const client = new Data();
      return client.getPodcast(episode.podcastPodexId);
    },
  },
};
