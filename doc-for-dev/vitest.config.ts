import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@forgeboard/shared": `${rootDir}packages/shared/src/index.ts`,
      "@forgeboard/domain": `${rootDir}packages/domain/src/index.ts`,
      "@forgeboard/persistence": `${rootDir}packages/persistence/src/index.ts`
    }
  },
  test: {
    environment: "node",
    include: [
      "packages/**/test/**/*.test.ts",
      "apps/api/test/**/*.test.ts",
      "apps/web/src/**/*.test.ts"
    ],
    restoreMocks: true
  }
});
