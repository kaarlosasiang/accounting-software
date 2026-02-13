const baseConfig = require("@sas/config-eslint/node.js");

module.exports = [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ["eslint.config.js"],
  },
];
