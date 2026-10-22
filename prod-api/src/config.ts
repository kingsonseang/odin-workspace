export type NodeEnv = "development" | "test" | "production";

export interface AppConfig {
  nodeEnv: NodeEnv;
  host: string;
  port: number;
  defaultPageSize: number;
  maxPageSize: number;
}

/**
 * Reads application settings from the process environment.
 *
 * Defaults are intended for local development. The caller supplies an
 * environment object in tests so configuration can be checked without
 * mutating global process state.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    nodeEnv: (env.NODE_ENV ?? "development") as NodeEnv,
    host: env.HOST ?? "127.0.0.1",
    port: Number(env.PORT ?? "3000"),
    defaultPageSize: Number(env.DEFAULT_PAGE_SIZE ?? "20"),
    maxPageSize: Number(env.MAX_PAGE_SIZE ?? "100"),
  };
}
