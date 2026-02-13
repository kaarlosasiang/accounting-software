# Accounting Software Monorepo

A comprehensive accounting system monorepo built with pnpm workspaces, featuring multiple applications and shared packages.

## 🏗️ Project Structure

```
.
├── apps/
│   ├── backend/      # Backend API (Express + MongoDB + TypeScript)
│   ├── frontend/     # Main accounting software app (Next.js)
│   ├── admin/        # Admin dashboard (Next.js)
│   └── site/         # Marketing/documentation site (Astro)
├── packages/
│   ├── validators/   # Shared Zod validation schemas
│   ├── ui/           # Shared UI component library
│   └── config-eslint/# Shared ESLint configurations
└── pnpm-workspace.yaml
```

## 📦 Apps

### `apps/backend`

REST API backend for the accounting system.

- **Package Name**: `api`
- **Tech Stack**: Express, MongoDB, Mongoose, better-auth, TypeScript
- **Key Features**: Authentication, logging (Winston), email (Nodemailer)
- **Port**: 3000 (default)

### `apps/frontend`

Main accounting software application.

- **Tech Stack**: Next.js 16, React 19, TypeScript
- **UI**: Radix UI, Tailwind CSS, shadcn/ui
- **Features**: Complete accounting workflows, invoices, bills, journal entries
- **Authentication**: better-auth integration

### `apps/admin`

Administrative dashboard for system management.

- **Tech Stack**: Next.js 16, React 19, TypeScript
- **UI**: Uses shared `ui` package
- **Purpose**: System administration and monitoring

### `apps/site`

Marketing and documentation website.

- **Tech Stack**: Astro, React, TypeScript
- **UI**: Tailwind CSS, Base UI
- **Purpose**: Product information and documentation

## 📦 Packages

### `packages/validators`

Shared validation schemas using Zod.

- **Package Name**: `@sas/validators`
- **Exports**: Validation schemas for accounts, invoices, customers, etc.
- **Benefits**: Single source of truth for validation across all apps

### `packages/ui`

Shared UI component library.

- **Tech Stack**: React 19, Radix UI, Tailwind CSS
- **Features**: Storybook for component development
- **Components**: Reusable UI components based on shadcn/ui

### `packages/config-eslint`

Shared ESLint configurations.

- **Configs**: Node.js, Next.js, and base configurations
- **Purpose**: Consistent code quality across the monorepo

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- pnpm v8 or higher

### Installation

Install all dependencies across the monorepo:

```bash
pnpm install
```

### Development

**Run all apps in parallel:**

```bash
pnpm dev
```

**Run individual apps:**

```bash
pnpm dev:api        # Backend API only
pnpm dev:app        # Frontend app only
pnpm dev:site       # Marketing site only
pnpm storybook      # UI component library
```

**Validators watch mode:**

```bash
pnpm validators:watch
```

### Building for Production

**Build everything:**

```bash
pnpm build
```

**Build specific apps/packages:**

```bash
pnpm build:api          # Backend API
pnpm build:app          # Frontend app
pnpm build:site         # Marketing site
pnpm build:validators   # Validators package
pnpm build:ui           # UI component library
```

### Running Production Builds

```bash
pnpm start:api          # Start backend API
pnpm start:frontend     # Start frontend app
pnpm preview:site       # Preview site build
```

### Docker

**Build backend Docker image:**

```bash
pnpm docker:build:api
```

## 🔧 Workspace Usage

Packages are shared between apps using pnpm workspaces.

### Adding a shared package to an app:

**For validators:**

```json
{
  "dependencies": {
    "@sas/validators": "workspace:*"
  }
}
```

**For UI components:**

```json
{
  "dependencies": {
    "ui": "workspace:*"
  }
}
```

Then run:

```bash
pnpm install
```

### Using validators in code:

**Backend (Express):**

```typescript
import { userLoginSchema } from "@sas/validators";
import { z } from "zod";

app.post("/auth/login", (req, res) => {
  try {
    const data = userLoginSchema.parse(req.body);
    // Handle validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
  }
});
```

**Frontend (React/Next.js):**

```typescript
import { userLoginSchema, type UserLogin } from "@sas/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const form = useForm<UserLogin>({
  resolver: zodResolver(userLoginSchema),
});
```

### Using UI components:

```typescript
import { Button, Input, Label } from 'ui';

export default function MyForm() {
  return (
    <div>
      <Label>Email</Label>
      <Input type="email" />
      <Button>Submit</Button>
    </div>
  );
}
```

## 🛠️ Scripts

### Root level (run from project root):

```bash
# Installation
pnpm install               # Install all dependencies
pnpm install:all          # Alias for pnpm install

# Development
pnpm dev                  # Run all apps in parallel
pnpm dev:api              # Run backend API only
pnpm dev:app              # Run frontend app only
pnpm dev:site             # Run marketing site only
pnpm storybook            # Run UI component Storybook

# Building
pnpm build                # Build all packages and apps
pnpm build:api            # Build backend API only
pnpm build:app            # Build frontend app only
pnpm build:site           # Build marketing site only
pnpm build:validators     # Build validators package
pnpm build:ui             # Build UI package
pnpm validators:watch     # Watch validators in dev mode

# Production
pnpm start:api            # Run production backend API
pnpm start:frontend       # Run production frontend app
pnpm preview:site         # Preview site build

# Docker
pnpm docker:build:api     # Build backend Docker image

# Quality
pnpm typecheck            # Type check all packages
pnpm lint                 # Lint all packages
pnpm clean                # Clean all node_modules and dist
```

### Backend scripts (in apps/backend):

```bash
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Run production build
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm seed:accounts    # Seed chart of accounts
pnpm seed:suppliers   # Seed supplier data
```

### Frontend scripts (in apps/frontend or apps/admin):

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Run production build
```

### Site scripts (in apps/site):

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
```

### Package scripts (in packages/validators or packages/ui):

```bash
pnpm build            # Build TypeScript to JavaScript
pnpm dev              # Watch mode for development
pnpm storybook        # (UI only) Run Storybook
```

## 📝 Development Workflows

### Adding New Validators

1. Create a new validator file in `packages/validators/src/`
2. Define Zod schemas and export types
3. Export from `packages/validators/src/index.ts`
4. Rebuild: `pnpm build:validators` (or use watch mode: `pnpm validators:watch`)
5. Use in your apps!

### Adding New UI Components

1. Create component in `packages/ui/components/`
2. Export from appropriate index file
3. Test in Storybook: `pnpm storybook`
4. Use in any app with `import { Component } from 'ui'`

### Running Tests

```bash
# Backend tests
cd apps/backend
pnpm test              # Run once
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
```

## 🤝 Benefits of This Setup

✅ **Type Safety**: Shared TypeScript types across all apps and packages  
✅ **Consistency**: Same validation rules and UI components everywhere  
✅ **DRY**: Define once, use everywhere (validators, components, configs)  
✅ **Fast**: pnpm workspaces provide instant local package linking  
✅ **Scalable**: Easy to add more apps or shared packages  
✅ **Isolated**: Each app can be built and deployed independently  
✅ **Developer Experience**: Storybook for UI, hot reload everywhere

## 📚 Tech Stack

### Core

- **Runtime**: Node.js 18+
- **Package Manager**: pnpm 10.8.0
- **Language**: TypeScript 5
- **Monorepo**: pnpm workspaces

### Backend

- **Framework**: Express 5
- **Database**: MongoDB with Mongoose
- **Auth**: better-auth
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Auth**: better-auth

### Marketing Site

- **Framework**: Astro 5
- **UI**: React components
- **Styling**: Tailwind CSS 4

### Development

- **Linting**: ESLint 9
- **Testing**: Jest (backend), Vitest (packages)
- **Component Development**: Storybook
