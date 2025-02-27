import { randomUUID } from "node:crypto";
import { RequestHandler } from "express";
import { pino } from "pino";
import { IS_DEV, LOG_LEVEL } from "./config";
import { context } from "./context";

let defaultLogger = pino({
  level: LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    bindings() {
      return {};
    },

    level(label) {
      return {
        level: label,
      };
    },
  },
  ...(IS_DEV
    ? {
        transport: {
          target: "pino-pretty",
        },
      }
    : {}),
});

type LoggingContext = Record<string, unknown>;

export type Logger = typeof defaultLogger;

export function logger(contextOrLabel?: LoggingContext | string) {
  if (!contextOrLabel) {
    return defaultLogger;
  }

  if (typeof contextOrLabel === "string") {
    return defaultLogger.child({ label: contextOrLabel });
  }

  return defaultLogger.child(contextOrLabel);
}

export function requestContextLogger(): RequestHandler {
  return (req, res, next) => {
    context(res).logger = logger({
      label: "request",
      method: req.method,
      path: req.originalUrl,
      requestId: req.header("request-id") ?? randomUUID(),
    });

    return next();
  };
}
