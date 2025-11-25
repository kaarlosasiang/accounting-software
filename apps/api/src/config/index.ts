import dbConnection from "./db";

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
};

export { constants, dbConnection };
