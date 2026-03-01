// eslint-disable-next-line
import "./api/v1/config/env.js";

import express from "express";

import configureApp from "./api/v1/config/app.js";
import logger from "./api/v1/config/logger.js";
import { constants, dbConnection } from "./api/v1/config/index.js";
import { seedRoles } from "./api/v1/shared/auth/seed-roles.js";

const app = express();

// Configure all middleware (includes global error handler)
configureApp(app);

const startServer = async () => {
  try {
    // Connect to database first
    await dbConnection.connect();

    // Seed system roles (idempotent)
    await seedRoles();

    // Then start the server
    app.listen(constants.port, () => {
      logger.info(`Server started on port ${constants.port}`, {
        port: constants.port,
        environment: constants.nodeEnv,
        frontendUrl: constants.frontEndUrl,
      });
    });
  } catch (error) {
    logger.logError(error as Error, {
      operation: "server-startup",
    });
    process.exit(1);
  }
};

// Start the application
startServer();
