# syntax=docker/dockerfile:1

# Multi-stage Dockerfile for the backend (api) in a pnpm monorepo
# - Installs only the necessary workspace deps (api + validators)
# - Builds TypeScript to dist
# - Runs with production-only dependencies

FROM node:20-alpine AS base
WORKDIR /workspace
RUN apk add --no-cache libc6-compat \
	&& corepack enable \
	&& corepack prepare pnpm@10.8.0 --activate

# Install deps for just the api and validators workspaces
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/validators/package.json packages/validators/package.json
COPY packages/config-eslint/package.json packages/config-eslint/package.json
RUN pnpm install --no-frozen-lockfile --ignore-scripts -r --filter @rrd10-sas/validators --filter api

# Build the validators first, then the api
FROM base AS build
COPY --from=deps /workspace/node_modules /workspace/node_modules
COPY --from=deps /workspace/pnpm-lock.yaml /workspace/pnpm-lock.yaml
COPY --from=deps /workspace/pnpm-workspace.yaml /workspace/pnpm-workspace.yaml
COPY --from=deps /workspace/package.json /workspace/package.json
COPY --from=deps /workspace/apps/backend/package.json /workspace/apps/backend/package.json
COPY --from=deps /workspace/packages/validators/package.json /workspace/packages/validators/package.json
COPY --from=deps /workspace/packages/config-eslint/package.json /workspace/packages/config-eslint/package.json
COPY packages/validators/ packages/validators/
COPY apps/backend/ apps/backend/
RUN pnpm install --no-frozen-lockfile --ignore-scripts -r --filter @rrd10-sas/validators --filter api
RUN pnpm -r --filter @rrd10-sas/validators --filter api build

# Production runtime with only necessary files
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat

# Workspace manifest for production install (api + validators only)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/validators/package.json packages/validators/package.json
COPY packages/config-eslint/package.json packages/config-eslint/package.json

# Install production deps scoped to the required workspaces
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate \
	&& pnpm install --prod --no-frozen-lockfile --ignore-scripts -r --filter @rrd10-sas/validators --filter api

# Copy built artifacts
COPY --from=build /workspace/apps/backend/dist apps/backend/dist
COPY --from=build /workspace/packages/validators/dist packages/validators/dist

# App runtime
ENV LOG_DIR=/app/logs
ENV PORT=4000
EXPOSE 4000
RUN mkdir -p /app/logs && chown -R node:node /app/logs
USER node
CMD ["node", "apps/backend/dist/index.js"]

