# Shared ESLint Config

Shared ESLint configuration for the RRD10 SAS monorepo.

## Configurations

- **Base** (`index.js`) - Core ESLint config with TypeScript, Prettier, and import sorting
- **Next.js** (`next.js`) - Configuration for Next.js/React projects
- **Node.js** (`node.js`) - Configuration for Node.js/Express projects

## Usage

### In Frontend (Next.js)

```javascript
// apps/frontend/eslint.config.mjs
import nextConfig from "@rrd10-sas/config-eslint/next.js";

export default nextConfig;
```

### In API (Node.js/Express)

```javascript
// apps/api/eslint.config.js
module.exports = {
  ...require("@rrd10-sas/config-eslint/node.js"),
};
```

## Features

- ✅ TypeScript support
- ✅ Prettier integration
- ✅ Auto-remove unused imports
- ✅ Auto-sort imports
- ✅ Consistent code style across projects
- ✅ React/Next.js specific rules
- ✅ Node.js/Express specific rules

## Rules

### TypeScript
- Warns on `any` types
- Ignores variables starting with `_`
- Allows empty object types

### Imports
- Auto-sorts imports by category
- Removes unused imports automatically
- Groups: Node.js built-ins → Packages → Internal → Relative → Styles

### Code Style
- Enforced via Prettier
- Consistent formatting across all projects
