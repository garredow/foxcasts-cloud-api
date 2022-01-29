import dotenv from 'dotenv';
import Joi from 'joi';
import { parseBool } from '../utils/parseBool';
dotenv.config();

enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
  Silent = 'silent',
}

export type Config = {
  logger: {
    enabled: boolean;
    level: `${LogLevel}`;
    file?: string;
  };
  auth0: {
    domain: string;
    audience: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  podcastIndex: {
    apiKey: string;
    apiSecret: string;
  };
  caching: {
    dataStaleMs: number;
  };
};

function createConfig() {
  const config: Config = {
    logger: {
      enabled: parseBool(process.env.LOGGER_ENABLED, true),
      level: process.env.LOGGER_LEVEL! as any,
      file: process.env.LOGGER_FILE || undefined,
    },
    auth0: {
      domain: process.env.AUTH0_DOMAIN!,
      audience: process.env.AUTH0_AUDIENCE!,
    },
    database: {
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT)!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_DATABASE!,
    },
    podcastIndex: {
      apiKey: process.env.PI_API_KEY!,
      apiSecret: process.env.PI_API_SECRET!,
    },
    caching: {
      dataStaleMs: Number(process.env.DATA_STALE_MS),
    },
  };

  const schema = Joi.object({
    logger: {
      enabled: Joi.bool().required(),
      level: Joi.string()
        .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent')
        .required(),
      file: Joi.string().optional(),
    },
    auth0: {
      domain: Joi.string().required(),
      audience: Joi.string().required(),
    },
    database: {
      host: Joi.string().required(),
      port: Joi.number().required(),
      user: Joi.string().required(),
      password: Joi.string().required(),
      database: Joi.string().required(),
    },
    podcastIndex: {
      apiKey: Joi.string().required(),
      apiSecret: Joi.string().required(),
    },
    caching: {
      dataStaleMs: Joi.number().required(),
    },
  });
  const { error } = schema.validate(config, { abortEarly: false });

  if (error) {
    console.error(
      'Invalid config',
      error.details.map((a) => a.message)
    );
    process.exit(1);
  }

  return config;
}

export const config = createConfig();
