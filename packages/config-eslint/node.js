/**
 * ESLint configuration for Node.js/Express projects (ESLint 9 flat config format)
 */
const baseConfig = require("./index.js");

module.exports = [
  ...baseConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        // Node.js globals
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        console: "readonly",
        exports: "writable",
        global: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
      },
    },
    rules: {
      // Node.js specific rules
      "no-console": "off", // Allow console in backend
      "@typescript-eslint/no-var-requires": "off", // Allow require() for CommonJS
      "@typescript-eslint/no-require-imports": "off", // Allow require imports
    },
  },
];
