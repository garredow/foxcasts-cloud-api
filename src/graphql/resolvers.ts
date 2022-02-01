import { IResolvers } from 'mercurius';

export const resolvers: IResolvers = {
  Query: {
    user(root, args, { userId, dataClient }, info) {
      return dataClient.getUserById(userId);
    },
    search(root, { query, count }, { dataClient }, info) {
      return dataClient.search(query, count ?? undefined);
    },
    async podcast(root, { id }, { dataClient }, info) {
      const res = await dataClient.getPodcast(id);
      return res;
    },
    async episode(root, { id }, { dataClient }, info) {
      const res = await dataClient.getEpisode(id);
      return res;
    },
  },
  Mutation: {
    async subscribe(root, { podcastId }, { dataClient, userId }, info) {
      return dataClient.subscribe(userId, podcastId);
    },
    async unsubscribe(root, { podcastId }, { dataClient, userId }, info) {
      return dataClient.unsubscribe(userId, podcastId);
    },
  },
  User: {
    subscriptions(user, args, { dataClient }, info) {
      return dataClient.getPodcastsByUserId(user.id);
    },
  },
  Podcast: {
    episodes(podcast, { count }, { dataClient }, info) {
      return count > 0 ? dataClient.getRecentEpisodes(podcast.id, count) : [];
    },
  },
  Episode: {
    podcast(episode, args, { dataClient }) {
      return dataClient.getPodcast(episode.podcastId);
    },
  },
};
