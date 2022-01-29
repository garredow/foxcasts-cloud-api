import knex from 'knex';
import _ from 'lodash';
import pg from 'pg';
import { PIApiEpisodeInfo, PIApiPodcast } from 'podcastdx-client/dist/src/types';
import { config } from '../lib/config';
import { Category, Episode, Podcast, Subscription, User } from '../models';
import { DbEpisode, DbPodcast, DbSubscription, DbUser } from './models';

pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => {
  return parseInt(value);
});

enum Table {
  Users = 'users',
  Podcasts = 'podcasts',
  Episodes = 'episodes',
  Categories = 'categories',
  Subscriptions = 'subscriptions',
  Progress = 'progress',
  Chapters = 'chapters',
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
      },
    });
  }

  async init() {
    const ON_UPDATE_TIMESTAMP_FUNCTION = `
      CREATE OR REPLACE FUNCTION on_update_timestamp()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = EXTRACT (EPOCH FROM now()::timestamp)::float*1000;
        RETURN NEW;
      END;
    $$ language 'plpgsql';
    `;

    await this.db.raw(ON_UPDATE_TIMESTAMP_FUNCTION);

    const autoUpdate = (table: Table) => `
      CREATE TRIGGER ${table}_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW
      EXECUTE PROCEDURE on_update_timestamp();
    `;

    await this.db.schema
      .hasTable(Table.Users)
      .then((exists) => {
        if (exists) return;
        return this.db.schema.createTable(Table.Users, (table) => {
          table.string('id').unique().index().primary();
          table.string('name');
          table.string('email');
          table.string('avatar_url');
          table.bigInteger('created_at').defaultTo(new Date().valueOf());
          table.bigInteger('updated_at').defaultTo(new Date().valueOf());
        });
      })
      .catch((err: Error) => console.error(`Failed to create ${Table.Users}`, err?.message));

    await this.db.schema
      .hasTable(Table.Podcasts)
      .then((exists) => {
        if (exists) return;
        return this.db.schema
          .createTable(Table.Podcasts, (table) => {
            table.bigInteger('id').unique().index().primary();
            table.bigInteger('itunes_id').unique().index().nullable();
            table.string('title');
            table.string('author');
            table.text('description').nullable();
            table.string('artwork_url');
            table.string('feed_url');
            table.specificType('categories', 'integer ARRAY').defaultTo('{}');
            table.bigInteger('last_fetched_episodes');
            table.bigInteger('created_at').defaultTo(new Date().valueOf());
            table.bigInteger('updated_at').defaultTo(new Date().valueOf());
          })
          .then(() => this.db.raw(autoUpdate(Table.Podcasts)));
      })
      .catch((err: Error) => console.error(`Failed to create ${Table.Podcasts}`, err?.message));

    await this.db.schema
      .hasTable(Table.Episodes)
      .then((exists) => {
        if (exists) return;
        return this.db.schema.createTable(Table.Episodes, (table) => {
          table.bigInteger('id').unique().index().primary();
          table.bigInteger('podcast_id').index();
          table.bigInteger('date').index();
          table.string('title');
          table.text('description').nullable();
          table.integer('duration');
          table.integer('file_size');
          table.string('file_type');
          table.string('file_url');
          table.string('chapters_url').nullable();
          table.string('transcript_url').nullable();
          table.integer('season').nullable();
          table.integer('episode').nullable();
          table.string('episode_type').nullable();
          table.string('image_url').nullable();
          table.bigInteger('created_at').defaultTo(new Date().valueOf());
          table.bigInteger('updated_at').defaultTo(new Date().valueOf());
        });
      })
      .catch((err: Error) => console.error(`Failed to create ${Table.Episodes}`, err?.message));

    await this.db.schema
      .hasTable(Table.Categories)
      .then((exists) => {
        if (exists) return;
        return this.db.schema.createTable(Table.Categories, (table) => {
          table.bigInteger('id').unique().index().primary();
          table.string('title');
          table.bigInteger('created_at').defaultTo(new Date().valueOf());
          table.bigInteger('updated_at').defaultTo(new Date().valueOf());
        });
      })
      .catch((err: Error) => console.error(`Failed to create ${Table.Categories}`, err?.message));

    await this.db.schema
      .hasTable(Table.Subscriptions)
      .then((exists) => {
        if (exists) return;
        return this.db.schema.createTable(Table.Subscriptions, (table) => {
          table.increments('id').unique().index().primary();
          table.string('user_id').index();
          table.bigInteger('podcast_id');
          table.bigInteger('created_at').defaultTo(new Date().valueOf());
          table.bigInteger('updated_at').defaultTo(new Date().valueOf());
        });
      })
      .catch((err: Error) =>
        console.error(`Failed to create ${Table.Subscriptions}`, err?.message)
      );

    await this.db.schema
      .hasTable(Table.Progress)
      .then((exists) => {
        if (exists) return;
        return this.db.schema.createTable(Table.Progress, (table) => {
          table.increments('id').unique().index().primary();
          table.string('user_id').index();
          table.bigInteger('podcast_id');
          table.bigInteger('episode_id').index();
          table.integer('current_time');
          table.timestamp('created_at').defaultTo(this.db.fn.now());
          table.bigInteger('updated_at').defaultTo(new Date().valueOf());
        });
      })
      .catch((err: Error) => console.error(`Failed to create ${Table.Progress}`, err?.message));

    // await this.db.schema
    //   .hasTable(Table.Chapters)
    //   .then((exists) => {
    //     if (exists) return;
    //     return this.db.schema.createTable(Table.Chapters, (table) => {
    //       table.increments('id').unique().index().primary();
    //       table.bigInteger('episodeId').index();
    //       table.json('data');
    //       table.bigInteger('createdAt').defaultTo(new Date().valueOf());
    //       table.bigInteger('updatedAt').defaultTo(new Date().valueOf());
    //     });
    //   })
    //   .catch((err: Error) => console.error(`Failed to create ${Table.Chapters}`, err?.message));
  }

  destroy() {
    return Promise.all([
      this.db.schema.dropTableIfExists(Table.Categories),
      this.db.schema.dropTableIfExists(Table.Chapters),
      this.db.schema.dropTableIfExists(Table.Episodes),
      this.db.schema.dropTableIfExists(Table.Podcasts),
      this.db.schema.dropTableIfExists(Table.Progress),
      this.db.schema.dropTableIfExists(Table.Subscriptions),
      this.db.schema.dropTableIfExists(Table.Users),
    ]);
  }

  // User

  async getUserById(id: string): Promise<User | undefined> {
    const result = await this.db<DbUser>(Table.Users).where({ id }).first();
    return result ? toCamelCase<User>(result) : result;
  }

  async addUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const dbItem = toSnakeCase<DbUser>(user);

    await this.db<DbUser>(Table.Users)
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
    return this.db<DbUser>(Table.Users).where({ id: userId }).update(dbData);
  }

  // Podcasts

  async addPodcast(podcast: PIApiPodcast): Promise<Podcast> {
    const dbitem = toSnakeCase<DbPodcast>(toPodcast(podcast));
    console.log('podcast1', podcast);
    console.log('podcast2', dbitem);

    const result = await this.db<DbPodcast>(Table.Podcasts)
      .insert(dbitem)
      .onConflict()
      .ignore()
      .returning('*')
      .then((res) => res[0]);

    return toCamelCase(result);
  }

  async getPodcastById(id: number): Promise<Podcast | undefined> {
    const result = await this.db<DbPodcast>(Table.Podcasts).where({ id }).first();
    return result ? toCamelCase<Podcast>(result) : result;
  }

  async getPodcastsByIds(ids: number[]): Promise<Podcast[]> {
    const result = await this.db<DbPodcast>(Table.Podcasts).whereIn('id', ids);
    return result.map((a) => toCamelCase<Podcast>(a));
  }

  async getPodcastsByUserId(userId: string): Promise<Podcast[]> {
    const podcastIds = await this.getSubscriptionsByUserId(userId).then((res) =>
      res.map((a) => a.podcastId)
    );
    console.log('IDS', podcastIds);

    return this.getPodcastsByIds(podcastIds);
  }

  updatePodcast(id: number, data: Partial<Podcast>): Promise<void> {
    const dbData = toSnakeCase<Partial<DbPodcast>>(data);
    return this.db<DbPodcast>(Table.Podcasts).where({ id }).update(dbData);
  }

  // Episodes

  async getEpisodeById(id: number): Promise<Episode | undefined> {
    const result = await this.db<DbEpisode>(Table.Episodes).where({ id }).first();
    return result ? toCamelCase<Episode>(result) : result;
  }

  async getEpisodesByIds(ids: number[]): Promise<Episode[]> {
    const result = await this.db<DbEpisode>(Table.Episodes).whereIn('id', ids);
    return result.map((a) => toCamelCase<Episode>(a));
  }

  async getEpisodesByPodcastId(podcastId: number, count = 20): Promise<Episode[]> {
    const result = await this.db<DbEpisode>(Table.Episodes)
      .orderBy('date', 'desc')
      .limit(count)
      .where({ podcast_id: podcastId });
    return result.map((a) => toCamelCase<Episode>(a));
  }

  addEpisode(episode: PIApiEpisodeInfo): Promise<Episode> {
    return this.db<DbEpisode>(Table.Episodes)
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
        Table.Episodes,
        newEpisodes.map((a) => toSnakeCase(toEpisode(a))),
        100
      );
    }
  }

  // Categories

  getCategoryById(id: number): Promise<Category | undefined> {
    return this.db<Category>(Table.Categories).where({ id }).first();
  }

  getCategoriesByIds(ids: number[]): Promise<Category[]> {
    return this.db(Table.Categories).whereIn('id', ids);
  }

  getAllCategories(): Promise<Category[]> {
    return this.db<Category>(Table.Categories);
  }

  async addCategories(categories: Pick<Category, 'id' | 'name'>[]): Promise<void> {
    const newCategories = await this.getCategoriesByIds(categories.map((a) => a.id)).then((res) => {
      const existing = res.map((a) => a.id);
      return categories.filter((a) => !existing.includes(a.id));
    });

    if (newCategories.length > 0) {
      await this.db.batchInsert<Category>(
        Table.Categories,
        newCategories.map((a) => toCategory(a))
      );
    }
  }

  // Subscriptions

  getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    return this.db<DbSubscription>(Table.Subscriptions)
      .where({ user_id: userId })
      .then((res) => res.map((a) => toCamelCase<Subscription>(a)));
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
    imageUrl: source.image,
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

function toSubscription(source: any): Category {
  const result: Category = {
    id: source.id,
    name: source.name,
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
  };

  return result;
}
