import pino from 'pino';
import { config } from './index';

const isDevelopment = config.nodeEnv === 'development';

const pinoConfig = {
  level: config.logging.level,
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
};

export const logger = pino(pinoConfig);

export default logger;
