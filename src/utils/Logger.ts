type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ?? "info";

function log(level: LogLevel, prefix: string, msg: string, data?: unknown) {
  if (LEVELS[level] < LEVELS[currentLevel]) return;
  const ts = new Date().toISOString();
  const entry = `[${ts}] [${level.toUpperCase()}] [${prefix}] ${msg}`;
  if (data !== undefined) {
    console[level === "error" ? "error" : "log"](entry, data);
  } else {
    console[level === "error" ? "error" : "log"](entry);
  }
}

export function createLogger(prefix: string) {
  return {
    debug: (msg: string, data?: unknown) => log("debug", prefix, msg, data),
    info: (msg: string, data?: unknown) => log("info", prefix, msg, data),
    warn: (msg: string, data?: unknown) => log("warn", prefix, msg, data),
    error: (msg: string, data?: unknown) => log("error", prefix, msg, data),
  };
}
