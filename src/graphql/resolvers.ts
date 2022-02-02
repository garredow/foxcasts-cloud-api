import { IResolvers } from 'mercurius';
import { Podcast } from '../models';

export const resolvers: IResolvers = {
  Query: {
    user(root, args, { userId, dataClient }, info) {
      return dataClient.user.getById(userId);
    },
    search(root, { query, count }, { dataClient }, info) {
      return dataClient.podcast.search(query, count ?? undefined);
    },
    async podcast(root, { id }, { dataClient }, info) {
      const res = await dataClient.podcast.getById(id);
      return res;
    },
    async episode(root, { id }, { dataClient }, info) {
      const res = await dataClient.episode.getById(id);
      return res;
    },
  },
  Mutation: {
    async subscribe(root, { podcastId }, { dataClient, userId }, info) {
      return dataClient.podcast.subscribe(userId, podcastId);
    },
    async unsubscribe(root, { podcastId }, { dataClient, userId }, info) {
      return dataClient.podcast.unsubscribe(userId, podcastId);
    },
    async updateProgress(root, { episodeId, progress }, { dataClient, userId }, info) {
      return dataClient.episode.setUserProgress(userId, episodeId, progress);
    },
  },
  User: {
    subscriptions(user, args, { dataClient }, info) {
      return dataClient.podcast.getByUserId(user.id);
    },
  },
  Podcast: {
    episodes(podcast, { count }, { dataClient }, info) {
      return count > 0 ? dataClient.episode.getRecent(podcast.id, count) : [];
    },
    isSubscribed(podcast, args, { dataClient, userId }, info) {
      return dataClient.podcast.checkIfSubscribed(userId, podcast.id);
    },
    artworkPalette(podcast, args, { dataClient }, info) {
      return dataClient.artwork.getPalette(podcast.id);
    },
  },
  Episode: {
    async podcast(episode, args, { dataClient }) {
      const res = await dataClient.podcast.getById(episode.podcastId);
      return res as Podcast;
    },
    progress(episode, args, { dataClient, userId }) {
      return dataClient.episode.getUserProgress(userId, episode.id);
    },
  },
};
