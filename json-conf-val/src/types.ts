export const ENVIRONMENTS = ["development", "test", "production"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

export const PORT_MIN = 1;
export const PORT_MAX = 65535;

export interface ConfigIssue {
  /** Field path, or a synthetic path such as `<root>` for document-level problems. */
  readonly path: string;
  readonly message: string;
}

export interface ServiceConfig {
  readonly serviceName: string;
  readonly port: number;
  readonly environment: Environment;
}
