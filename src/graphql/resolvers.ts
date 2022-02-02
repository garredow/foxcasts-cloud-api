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
    async updateProgress(root, { episodeId, progress }, { dataClient, userId }, info) {
      return dataClient.setEpisodeProgress(userId, episodeId, progress);
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
    isSubscribed(podcast, args, { dataClient, userId }, info) {
      return dataClient.checkIfSubscribed(userId, podcast.id);
    },
    artworkPalette(podcast, args, { dataClient }, info) {
      return dataClient.getPodcastPalette(podcast.id);
    },
  },
  Episode: {
    podcast(episode, args, { dataClient }) {
      return dataClient.getPodcast(episode.podcastId);
    },
    progress(episode, args, { dataClient, userId }) {
      return dataClient.getEpisodeProgress(userId, episode.id);
    },
  },
};
