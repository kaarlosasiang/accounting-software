import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { constants } from ".";
import apiKeyMiddleware from "../shared/middleware/apiKey.middleware";
import { requestLogger, errorLogger } from "../shared/middleware/logger.middleware";
import logger from "./logger";

export default (app: Application): Application => {
  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: constants.corsOrigin,
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Cookie parsing
  app.use(cookieParser());

  // HTTP request logging (morgan + winston)
  if (constants.nodeEnv === "development") {
    app.use(morgan("dev"));
  } else {
    // Production: log to winston
    app.use(
      morgan("combined", {
        stream: {
          write: (message: string) => {
            logger.info(message.trim());
          },
        },
      })
    );
  }

  // Custom request/response logger
  app.use(requestLogger);

  // Default route
  app.get("/", (req, res) => {
    res.json({ 
      message: "RRD10 SAS API is running",
      version: "1.0.0",
      environment: constants.nodeEnv,
    });
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    const dbConnection = require("./db").default;
    const dbStatus =
      dbConnection.mongoose?.connection?.readyState === 1
        ? "connected"
        : "disconnected";
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      environment: constants.nodeEnv,
    });
  });

  // Status check (returns frontend URL)
  app.get("/status", (req, res) => {
    res.json({
      frontendUrl: constants.frontEndUrl,
      apiVersion: "1.0.0",
    });
  });

  // API Key middleware (applied after health checks)
  app.use(apiKeyMiddleware);

  // Register all API routes
  const registerRoutes = require("../routes").default;
  registerRoutes(app);

  // Error logging middleware (before error handlers)
  app.use(errorLogger);

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    // Log the error
    logger.logError(err, {
      path: req.path,
      method: req.method,
      correlationId: req.correlationId,
    });

    res.status(err.status || 500).json({
      error:
        constants.nodeEnv === "production"
          ? "Internal server error"
          : err.message,
      correlationId: req.correlationId,
    });
  });

  return app;
};
