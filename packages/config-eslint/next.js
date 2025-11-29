/**
 * ESLint configuration for Next.js projects
 */
module.exports = {
  extends: [
    "./index.js",
    "next/typescript",
    "next/core-web-vitals",
  ],
  rules: {
    // Next.js specific rules
    "import/no-default-export": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // Override import sorting for React/Next.js projects
    "simple-import-sort/imports": [
      "error",
      {
        groups: [
          // `react` first, `next` second, then packages starting with a character
          ["^react$", "^next", "^@?\\w"],
          // Internal packages
          ["^(@rrd10-sas)(/.*|$)"],
          // Absolute imports from `@/`
          ["^@/"],
          // Parent imports
          ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
          // Other relative imports
          ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
          // Style imports
          ["^.+\\.s?css$"],
          // Side effect imports
          ["^\\u0000"],
        ],
      },
    ],
  },
  overrides: [
    {
      files: ["*.config.js", "*.config.ts"],
      env: {
        node: true,
      },
    },
  ],
};
