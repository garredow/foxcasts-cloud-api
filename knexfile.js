require('dotenv').config({ path: './.env' });

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    application_name: process.env.APP_NAME,
  },
  migrations: {
    directory: __dirname + `/src/database/migrations`,
  },
  seeds: {
    directory: __dirname + `/src/database/seeds`,
  },
};
