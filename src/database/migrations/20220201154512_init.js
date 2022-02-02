const table = {
  user: 'user',
  podcast: 'podcast',
  episode: 'episode',
  category: 'category',
  subscription: 'subscription',
  progress: 'progress',
  chapter: 'chapter',
  palette: 'palette',
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
    .hasTable(table.user)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.user, (table) => {
        table.string('id').unique().index().primary();
        table.string('name');
        table.string('email');
        table.string('avatar_url');
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.user}`, err?.message));

  await knex.schema
    .hasTable(table.podcast)
    .then((exists) => {
      if (exists) return;
      return knex.schema
        .createTable(table.podcast, (table) => {
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
        .then(() => knex.raw(autoUpdate(table.podcast)));
    })
    .catch((err) => console.error(`Failed to create ${table.podcast}`, err?.message));

  await knex.schema
    .hasTable(table.episode)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.episode, (table) => {
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
    .catch((err) => console.error(`Failed to create ${table.episode}`, err?.message));

  await knex.schema
    .hasTable(table.category)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.category, (table) => {
        table.bigInteger('id').unique().index().primary();
        table.string('title');
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.category}`, err?.message));

  await knex.schema
    .hasTable(table.subscription)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.subscription, (table) => {
        table.primary(['user_id', 'podcast_id']);
        table.string('user_id').index();
        table.bigInteger('podcast_id');
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.subscription}`, err?.message));

  await knex.schema
    .hasTable(table.progress)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.progress, (table) => {
        table.primary(['user_id', 'episode_id']);
        table.string('user_id').index();
        table.bigInteger('episode_id').index();
        table.integer('current_time');
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.progress}`, err?.message));

  await knex.schema
    .hasTable(table.palette)
    .then((exists) => {
      if (exists) return;
      return knex.schema.createTable(table.palette, (table) => {
        table.bigInteger('podcast_id').primary().unique().index();
        table.string('dark_muted');
        table.string('dark_vibrant');
        table.string('light_muted');
        table.string('light_vibrant');
        table.string('muted');
        table.string('vibrant');
        table.bigInteger('created_at').defaultTo(Date.now());
        table.bigInteger('updated_at').defaultTo(Date.now());
      });
    })
    .catch((err) => console.error(`Failed to create ${table.palette}`, err?.message));

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
    this.db.schema.dropTableIfExists(table.category),
    this.db.schema.dropTableIfExists(table.chapter),
    this.db.schema.dropTableIfExists(table.episode),
    this.db.schema.dropTableIfExists(table.podcast),
    this.db.schema.dropTableIfExists(table.progress),
    this.db.schema.dropTableIfExists(table.subscription),
    this.db.schema.dropTableIfExists(table.user),
    this.db.schema.dropTableIfExists(table.palette),
  ]);
};
