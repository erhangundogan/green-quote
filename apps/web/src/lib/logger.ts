import pino from 'pino';

const isDev = process.env['NODE_ENV'] !== 'production';

// pino-pretty is used only in development and loaded via pino's worker-thread
// transport so it never touches the production bundle. In production, pino
// writes structured JSON to stdout which log aggregators (Cloud Logging, etc.)
// can ingest directly.
export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  base: { service: 'greenquote-api' },
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, ignore: 'pid,hostname' },
        },
      }
    : {}),
});
