// eslint-disable-next-line
import "./api/v1/config/env.js";

import express from "express";

import configureApp from "./api/v1/config/app.js";
import logger from "./api/v1/config/logger.js";
import { constants, dbConnection } from "./api/v1/config/index.js";

const app = express();

// Configure all middleware (includes global error handler)
configureApp(app);

// Start server function
const startServer = async () => {
  try {
    // Connect to database first
    await dbConnection.connect();

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
