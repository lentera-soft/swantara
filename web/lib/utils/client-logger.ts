type LogLevel = "debug" | "info" | "warn" | "error";

function safeStringify(arg: unknown): string {
  const seen = new WeakSet<object>();
  function serialize(value: unknown): unknown {
    if (value === null || typeof value !== "object") {
      return value;
    }
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    if (Array.isArray(value)) {
      return value.map(serialize);
    }
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      obj[key] = serialize(val);
    }
    return obj;
  }
  try {
    return JSON.stringify(serialize(arg));
  } catch {
    return String(arg);
  }
}

function normalizeArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === "object" && arg !== null) {
      return safeStringify(arg);
    }
    return arg;
  });
}

function log(level: LogLevel, args: unknown[]) {
  try {
    console[level](...normalizeArgs(args));
  } catch {
    const message = args.find((arg) => typeof arg === "string");
    if (typeof message === "string") {
      try {
        console[level](message);
      } catch {
        // swallow
      }
    }
  }
}

export const logger = {
  debug: (...args: unknown[]) => log("debug", args),
  info: (...args: unknown[]) => log("info", args),
  warn: (...args: unknown[]) => log("warn", args),
  error: (...args: unknown[]) => log("error", args),
};
