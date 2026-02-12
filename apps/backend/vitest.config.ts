import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: "./src",
    include: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/auth.test.ts"],
    setupFiles: ["./api/v1/__tests__/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["**/*.ts"],
      exclude: [
        "**/*.d.ts",
        "index.ts",
        "api/v1/config/**",
        "api/v1/scripts/**",
        "**/__tests__/**",
      ],
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "../coverage",
    },
  },
});
