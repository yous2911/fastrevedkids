import pino, { LoggerOptions } from 'pino';
import { config } from '../config/config.js';

const loggerOptions: LoggerOptions = {
  level: validateEnvironment().LOG_LEVEL,
  transport: validateEnvironment().NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
};

export const logger = pino(loggerOptions);
