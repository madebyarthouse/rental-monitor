import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: [
      "workers/cron-scraper/**/*.test.ts",
      "workers/cron-scraper/**/*.spec.ts",
    ],
  },
});


