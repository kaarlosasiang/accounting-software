// eslint-disable-next-line
import "./api/v1/config/env";

import express from "express";

import configureApp from "./api/v1/config/app";
import logger from "./api/v1/config/logger";
import { constants, dbConnection } from "./api/v1/config";

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
