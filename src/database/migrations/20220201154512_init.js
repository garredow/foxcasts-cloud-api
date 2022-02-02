const table = {
  users: 'users',
  podcasts: 'podcasts',
  episodes: 'episodes',
  categories: 'categories',
  subscriptions: 'subscriptions',
  progress: 'progress',
  chapters: 'chapters',
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const ON_UPDATE_TIMESTAMP_FUNCTION = `
    CREATE OR REPLACE FUNCTION on_update_timestamp()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = EXTRACT (EPOCH FROM now()::timestamp)::float*1000;
      RETURN NEW;
    END;
  $$ language 'plpgsql';
  `;

  await knex.raw(ON_UPDATE_TIMESTAMP_FUNCTION);

  const autoUpdate = (table) => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;

  await knex.schema
    .hasTable(table.users)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.users, (table) => {
        table.string('id').unique().index().primary();
        table.string('name');
        table.string('email');
        table.string('avatar_url');
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.users}`, err?.message));

  await knex.schema
    .hasTable(table.podcasts)
    .then((exists) => {
      if (exists) return;
      return knex.schema
        .createTable(table.podcasts, (table) => {
          table.bigInteger('id').unique().index().primary();
          table.bigInteger('itunes_id').unique().index().nullable();
          table.string('title');
          table.string('author');
          table.text('description').nullable();
          table.string('artwork_url');
          table.string('feed_url');
          table.specificType('categories', 'integer ARRAY').defaultTo('{}');
          table.bigInteger('last_fetched_episodes');
          table.bigInteger('created_at').defaultTo(Date.now());
          table.bigInteger('updated_at').defaultTo(Date.now());
        })
        .then(() => knex.raw(autoUpdate(table.podcasts)));
    })
    .catch((err) => console.error(`Failed to create ${table.podcasts}`, err?.message));

  await knex.schema
    .hasTable(table.episodes)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.episodes, (table) => {
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
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.episodes}`, err?.message));

  await knex.schema
    .hasTable(table.categories)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.categories, (table) => {
        table.bigInteger('id').unique().index().primary();
        table.string('title');
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.categories}`, err?.message));

  await knex.schema
    .hasTable(table.subscriptions)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.subscriptions, (table) => {
        table.primary(['user_id', 'podcast_id']);
        table.string('user_id').index();
        table.bigInteger('podcast_id');
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.subscriptions}`, err?.message));

  await knex.schema
    .hasTable(table.progress)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.progress, (table) => {
        table.primary(['user_id', 'episode_id']);
        table.string('user_id').index();
        table.bigInteger('episode_id').index();
        table.integer('current_time');
        table.timestamp('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.progress}`, err?.message));

  // await knex.schema
  //   .hasTable(Table.Chapters)
  //   .then((exists) => {
  //     if (exists) return;
  //     return knex.schema.createTable(Table.Chapters, (table) => {
  //       table.increments('id').unique().index().primary();
  //       table.bigInteger('episodeId').index();
  //       table.json('data');
  //       table.bigInteger('createdAt').defaultTo(Date.now());
  //       table.bigInteger('updatedAt').defaultTo(Date.now());
  //     });
  //   })
  //   .catch((err) => console.error(`Failed to create ${Table.Chapters}`, err?.message));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.all([
    this.db.schema.dropTableIfExists(table.categories),
    this.db.schema.dropTableIfExists(table.chapters),
    this.db.schema.dropTableIfExists(table.episodes),
    this.db.schema.dropTableIfExists(table.podcasts),
    this.db.schema.dropTableIfExists(table.progress),
    this.db.schema.dropTableIfExists(table.subscriptions),
    this.db.schema.dropTableIfExists(table.users),
  ]);
};
