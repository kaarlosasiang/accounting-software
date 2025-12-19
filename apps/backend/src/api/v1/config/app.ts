import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";

import apiKeyMiddleware from "../shared/middleware/apiKey.middleware";
import {
  errorLogger,
  requestLogger,
} from "../shared/middleware/logger.middleware";

import logger from "./logger";
import { constants } from ".";

export default (app: Application): Application => {
  // Security middleware - disable CSP for Better Auth
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: constants.corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 200,
    }),
  );

  // Cookie parsing - Better Auth needs this early
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
      }),
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

  // Body parsing middleware - needed for most routes except Better Auth
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Register all routes (Better Auth handles its own body parsing)
  const registerRoutes = require("../routes").default;
  registerRoutes(app);

  // API Key middleware (applied to non-auth routes only)
  // Auth routes are already registered and handle their own authentication
  app.use("/api/v1/users", apiKeyMiddleware);
  // Add API key middleware to other protected routes as needed
  // app.use("/api/v1/companies", apiKeyMiddleware);
  // app.use("/api/v1/clients", apiKeyMiddleware);

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
