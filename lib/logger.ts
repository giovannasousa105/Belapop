import pino from "pino";

type LogLevel = "info" | "warn" | "error" | "debug";

type LogPayload = Record<string, unknown>;

const redactPaths = [
  "email",
  "*.email",
  "senha",
  "*.senha",
  "password",
  "*.password",
  "token",
  "*.token",
  "authorization",
  "*.authorization",
  "headers.authorization",
  "cookie",
  "*.cookie",
  "stripe_event_id",
  "*.stripe_event_id",
  "payment_intent_id",
  "*.payment_intent_id"
];

function createTransport() {
  if (process.env.NODE_ENV !== "production" || !process.env.AXIOM_TOKEN) {
    return undefined;
  }

  return pino.transport({
    target: "@axiomhq/pino",
    options: {
      dataset: process.env.AXIOM_DATASET ?? "belapop-prod",
      token: process.env.AXIOM_TOKEN
    }
  });
}

const loggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: redactPaths,
    censor: "[redacted]"
  },
  base: {
    service: "belapop-nextjs",
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "local"
  },
  timestamp: pino.stdTimeFunctions.isoTime
};

const transport = createTransport();
const pinoLogger = transport ? pino(loggerOptions, transport) : pino(loggerOptions);

function emit(level: LogLevel, data: LogPayload): void {
  pinoLogger[level](data);
}

export const logger = {
  info: (data: LogPayload) => emit("info", data),
  warn: (data: LogPayload) => emit("warn", data),
  error: (data: LogPayload) => emit("error", data),
  debug: (data: LogPayload) => emit("debug", data)
};
