import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Creates a clean schema once per run.
    globalSetup: ["tests/globalSetup.ts"],
    // Per worker: test env, mocks, table reset before each file.
    setupFiles: ["tests/setup.ts"],
    // All files share one database, so they run one after another.
    fileParallelism: false,
    // bcrypt cost 12 makes each login or registration take ~200 ms.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
