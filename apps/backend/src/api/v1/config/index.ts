import dbConnection from './db.js';

import "./env.js";

const constants = {
  // Server
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Frontend
  frontEndUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // API Security
  apiKey: process.env.API_KEY || "",

  // Database
  mongodbUri: process.env.MONGODB_URI as string,
  dbName: process.env.DB_NAME || "rrd10-sas",

  // JWT (for future auth)
  jwtSecret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Logging
  logLevel: process.env.LOG_LEVEL || "debug",
  logDir: process.env.LOG_DIR || "./logs",
  appName: process.env.APP_NAME || "rrd10-sas-api",

  // CORS
  corsOrigin:
    process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000",

  // Better Auth
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || "dev-better-auth-secret",
  betterAuthUrl:
    process.env.BETTER_AUTH_URL ||
    `${process.env.API_BASE_URL || `http://localhost:${Number(process.env.PORT) || 4000}`}/api/v1/auth`,
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
};

export { constants, dbConnection };
