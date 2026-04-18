import baseConfig from "../../packages/config-eslint/node.js";

export default [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["eslint.config.js"],
  },
  {
    ignores: [
      "src/api/v1/__tests__/**",
      "src/api/v1/scripts/**",
      "vitest.config.ts",
    ],
  },
];
