import knex from 'knex';
import _ from 'lodash';
import pg from 'pg';
import { PIApiEpisodeInfo, PIApiPodcast } from 'podcastdx-client/dist/src/types';
import { config } from '../lib/config';
import { Category, Episode, Palette, Podcast, Subscription, User } from '../models';
import { DbEpisode, DbPalette, DbPodcast, DbProgress, DbSubscription, DbUser } from './models';

pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => {
  return parseInt(value);
});

enum Table {
  User = 'user',
  Podcast = 'podcast',
  Episode = 'episode',
  Category = 'category',
  Subscription = 'subscription',
  Progress = 'progress',
  Chapter = 'chapter',
  Palette = 'palette',
}

export class Database {
  private db;

  constructor() {
    this.db = knex({
      client: 'pg',
      connection: {
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database,
        application_name: config.meta.appName,
      },
    });
  }

  // User

  async getUserById(id: string): Promise<User | undefined> {
    const result = await this.db<DbUser>(Table.User).where({ id }).first();
    return result ? toCamelCase<User>(result) : result;
  }

  async addUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const dbItem = toSnakeCase<DbUser>(user);

    await this.db<DbUser>(Table.User)
      .insert({
        ...dbItem,
        created_at: new Date().valueOf(),
        updated_at: new Date().valueOf(),
      })
      .onConflict()
      .ignore();

    const result = await this.getUserById(user.id);

    return toCamelCase<User>(result);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const dbData = toSnakeCase<Partial<DbUser>>(data);
    return this.db<DbUser>(Table.User).where({ id: userId }).update(dbData);
  }

  // Podcasts

  async addPodcast(podcast: PIApiPodcast): Promise<Podcast> {
    const dbitem = toSnakeCase<DbPodcast>(toPodcast(podcast));
    return this.db<DbPodcast>(Table.Podcast)
      .insert(dbitem)
      .onConflict()
      .ignore()
      .returning('*')
      .then((res) => toCamelCase(res[0]));
  }

  async getPodcastById(id: number): Promise<Podcast | undefined> {
    const result = await this.db<DbPodcast>(Table.Podcast).where({ id }).first();
    return result ? toCamelCase<Podcast>(result) : result;
  }

  async getPodcastsByIds(ids: number[]): Promise<Podcast[]> {
    const result = await this.db<DbPodcast>(Table.Podcast).whereIn('id', ids);
    return result.map((a) => toCamelCase<Podcast>(a));
  }

  async getPodcastsByUserId(userId: string): Promise<Podcast[]> {
    const podcastIds = await this.getSubscriptionsByUserId(userId).then((res) =>
      res.map((a) => a.podcastId)
    );

    return this.getPodcastsByIds(podcastIds);
  }

  updatePodcast(id: number, data: Partial<Podcast>): Promise<void> {
    const dbData = toSnakeCase<Partial<DbPodcast>>(data);
    return this.db<DbPodcast>(Table.Podcast).where({ id }).update(dbData);
  }

  // Episodes

  async getEpisodeById(id: number): Promise<Episode | undefined> {
    const result = await this.db<DbEpisode>(Table.Episode).where({ id }).first();
    return result ? toCamelCase<Episode>(result) : result;
  }

  async getEpisodesByIds(ids: number[]): Promise<Episode[]> {
    const result = await this.db<DbEpisode>(Table.Episode).whereIn('id', ids);
    return result.map((a) => toCamelCase<Episode>(a));
  }

  async getEpisodesByPodcastId(podcastId: number, count = 20): Promise<Episode[]> {
    const result = await this.db<DbEpisode>(Table.Episode)
      .orderBy('date', 'desc')
      .limit(count)
      .where({ podcast_id: podcastId });
    return result.map((a) => toCamelCase<Episode>(a));
  }

  addEpisode(episode: PIApiEpisodeInfo): Promise<Episode> {
    return this.db<DbEpisode>(Table.Episode)
      .insert(toEpisode(episode))
      .onConflict()
      .merge()
      .returning('*')
      .then((res) => toCamelCase<Episode>(res[0]));
  }

  async addEpisodes(episodes: PIApiEpisodeInfo[]): Promise<void> {
    const newEpisodes = await this.getEpisodesByIds(episodes.map((a) => a.id)).then((res) => {
      const existing = res.map((a) => a.id);
      return episodes.filter((a) => !existing.includes(a.id));
    });

    if (newEpisodes.length > 0) {
      await this.db.batchInsert<DbEpisode>(
        Table.Episode,
        newEpisodes.map((a) => toSnakeCase(toEpisode(a))),
        100
      );
    }
  }

  getEpisodeProgress(userId: string, episodeId: number): Promise<number> {
    return this.db<DbProgress>(Table.Progress)
      .where({ user_id: userId, episode_id: episodeId })
      .first()
      .then((res) => (res ? res.current_time : 0));
  }

  async setEpisodeProgress(userId: string, episodeId: number, progress: number): Promise<boolean> {
    await this.db<DbProgress>(Table.Progress)
      .insert({ user_id: userId, episode_id: episodeId, current_time: progress })
      .onConflict(['user_id', 'episode_id'])
      .merge();
    return true;
  }

  // Categories

  getCategoryById(id: number): Promise<Category | undefined> {
    return this.db<Category>(Table.Category).where({ id }).first();
  }

  getCategoriesByIds(ids: number[]): Promise<Category[]> {
    return this.db(Table.Category).whereIn('id', ids);
  }

  getAllCategories(): Promise<Category[]> {
    return this.db<Category>(Table.Category);
  }

  async addCategories(categories: Pick<Category, 'id' | 'name'>[]): Promise<void> {
    const newCategories = await this.getCategoriesByIds(categories.map((a) => a.id)).then((res) => {
      const existing = res.map((a) => a.id);
      return categories.filter((a) => !existing.includes(a.id));
    });

    if (newCategories.length > 0) {
      await this.db.batchInsert<Category>(
        Table.Category,
        newCategories.map((a) => toCategory(a))
      );
    }
  }

  // Subscriptions

  async addSubscription(userId: string, podcastId: number): Promise<number> {
    const res = await this.db<DbSubscription>(Table.Subscription)
      .insert({
        user_id: userId,
        podcast_id: podcastId,
        created_at: new Date().valueOf(),
        updated_at: new Date().valueOf(),
      })
      .onConflict()
      .ignore();
    return res[0];
  }

  async deleteSubscription(userId: string, podcastId: number): Promise<number> {
    const res = await this.db<DbSubscription>(Table.Subscription)
      .where({ user_id: userId, podcast_id: podcastId })
      .delete();

    return res;
  }

  getSubscription(userId: string, podcastId: number): Promise<Subscription | undefined> {
    return this.db<DbSubscription>(Table.Subscription)
      .where({ user_id: userId, podcast_id: podcastId })
      .first()
      .then((res) => (res ? toCamelCase<Subscription>(res) : res));
  }

  getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    return this.db<DbSubscription>(Table.Subscription)
      .where({ user_id: userId })
      .then((res) => res.map((a) => toCamelCase<Subscription>(a)));
  }

  // Palette

  async addPalette(podcastId: number, palette: Palette): Promise<Palette> {
    await this.db<DbPalette>(Table.Palette)
      .insert(
        toSnakeCase({
          podcastId,
          ...palette,
        })
      )
      .onConflict('podcast_id')
      .merge();

    return palette;
  }

  async getPaletteByPodcastId(podcastId: number): Promise<Palette | undefined> {
    return this.db<DbPalette>(Table.Palette)
      .where({ podcast_id: podcastId })
      .first()
      .then((res) => (res ? toCamelCase(res) : res));
  }
}

function toSnakeCase<TResult>(source: any): TResult {
  const result = Object.entries(source).reduce((acc, [key, val]) => {
    acc[_.snakeCase(key)] = val;
    return acc;
  }, {} as any);

  return result as TResult;
}

function toCamelCase<TResult>(source: any): TResult {
  const result = Object.entries(source).reduce((acc, [key, val]) => {
    acc[_.camelCase(key)] = val;
    return acc;
  }, {} as any);

  return result as TResult;
}

function toPodcast(source: PIApiPodcast): Podcast {
  const result: Podcast = {
    id: source.id,
    itunesId: source.itunesId || undefined,
    title: source.title,
    author: source.author,
    description: source.description,
    artworkUrl: source.artwork,
    feedUrl: source.url,
    categories: source.categories ? Object.keys(source.categories).map((a) => Number(a)) : [],
    lastFetchedEpisodes: new Date().valueOf(),
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
  };
  return result;
}

function toEpisode(source: PIApiEpisodeInfo): Episode {
  const result: Episode = {
    id: source.id,
    podcastId: source.feedId,
    date: source.datePublished * 1000,
    title: source.title,
    description: source.description,
    duration: source.duration,
    fileSize: source.enclosureLength,
    fileType: source.enclosureType,
    fileUrl: source.enclosureUrl,
    chaptersUrl: source.chaptersUrl ?? undefined,
    transcriptUrl: source.transcriptUrl ?? undefined,
    season: source.season,
    episode: source.episode ?? undefined,
    episodeType: source.episodeType ?? undefined,
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
  };

  return result;
}

function toCategory(source: Pick<Category, 'id' | 'name'>): Category {
  const result: Category = {
    id: source.id,
    name: source.name,
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
  };

  return result;
}
