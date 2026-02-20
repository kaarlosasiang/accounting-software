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

### Email Configuration (Resend)

This application uses [Resend](https://resend.com) for sending emails (OTP codes, invoices, invitations).

**Setup Instructions:**

1. Create a free account at [resend.com](https://resend.com)
2. Get your API key from [resend.com/api-keys](https://resend.com/api-keys)
3. Add it to your `.env` file:
   ```
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

**Important Notes:**

- Free tier includes 100 emails/day
- Default `onboarding@resend.dev` works for testing
- For production, verify your own domain in Resend dashboard
- Once verified, use your own email like `noreply@yourdomain.com`

## Project Structure

```
src/
  index.ts        # Main application entry point
dist/             # Compiled JavaScript (generated)
```

## API Endpoints

- `GET /` - Health check endpoint
