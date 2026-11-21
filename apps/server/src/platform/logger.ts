/** ログに添える値。 */
export type LogDetails = Readonly<Record<string, unknown>>;

/** 1件のログ。 */
export type LogEntry = {
  /** ログの重さ。 */
  readonly level: "error" | "warn" | "info";
  /** 何が起きたか。 */
  readonly message: string;
  /** ログに添える値。 */
  readonly details: LogDetails;
};

/** ログを1件ずつ書き出す logger。 */
export type Logger = {
  /** 1件のログを書き出す。 */
  readonly write: (entry: LogEntry) => void;
};

const MAX_CAUSE_DEPTH = 3;

const describeError = (error: Error, depth: number): unknown => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
  cause:
    error.cause instanceof Error && depth < MAX_CAUSE_DEPTH
      ? describeError(error.cause, depth + 1)
      : undefined,
});

const safeReplacer = () => {
  const seen = new WeakSet<object>();

  return (_key: string, value: unknown): unknown => {
    if (typeof value === "bigint") {
      return value.toString();
    }

    if (value instanceof Error) {
      return describeError(value, 1);
    }

    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }

      seen.add(value);
    }

    return value;
  };
};

/** 1件のログを、1行の JSON の文字列にする。 */
export const formatLogLine = (entry: LogEntry): string =>
  `${JSON.stringify(entry, safeReplacer())}\n`;

/** 標準出力と標準エラーに、1行1件の JSON でログを書く Logger。 */
export const stdoutLogger: Logger = {
  /** 1件のログを1行の JSON で書き出す。 */
  write: (entry) => {
    const stream = entry.level === "info" ? process.stdout : process.stderr;

    stream.write(formatLogLine(entry));
  },
};
