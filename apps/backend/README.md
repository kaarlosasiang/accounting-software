# API Backend

Node.js Express backend built with TypeScript.

## Prerequisites

- Node.js (v18 or higher)
- pnpm

## Installation

```bash
pnpm install
```

## Development

Start the development server with hot reload:

```bash
pnpm dev
```

The server will run on `http://localhost:3000` by default.

## Build

Compile TypeScript to JavaScript:

```bash
pnpm build
```

## Production

Run the compiled JavaScript:

```bash
pnpm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

## Project Structure

```
src/
  index.ts        # Main application entry point
dist/             # Compiled JavaScript (generated)
```

## API Endpoints

- `GET /` - Health check endpoint

