import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { oneTap } from "better-auth/plugins";
import { MongoClient } from "mongodb";

import { constants } from "../../config";
import logger from "../../config/logger";

const mongoClient = new MongoClient(constants.mongodbUri, {
  maxPoolSize: 5,
});

const db = mongoClient.db(constants.dbName);

export const authServer = betterAuth({
  appUrl: constants.frontEndUrl, // Frontend URL for redirects
  baseURL: constants.betterAuthUrl, // API auth endpoint
  secret: constants.betterAuthSecret,
  trustedOrigins: [constants.frontEndUrl, constants.corsOrigin],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: constants.googleClientId,
      clientSecret: constants.googleClientSecret,
      enabled: !!(constants.googleClientId && constants.googleClientSecret),
    },
  },
  user: {
    additionalFields: {
      companyId: { type: "string", required: false }, // Optional for social login
      role: {
        type: "string",
        required: false, // Will be set after social login
      },
      first_name: { type: "string", required: false },
      middle_name: { type: "string", required: false },
      last_name: { type: "string", required: false },
      phone_number: { type: "string", required: false },
      username: { type: "string", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: constants.nodeEnv === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: constants.nodeEnv === "production",
    },
  },
  database: mongodbAdapter(db, { client: mongoClient }),
  plugins: [
    oneTap({
      disableSignup: false,
    }),
  ],
});

mongoClient
  .connect()
  .then(() => {
    logger.info("Better Auth MongoDB adapter connected");
  })
  .catch((error) => {
    logger.logError(error as Error, {
      operation: "better-auth-mongo",
    });
  });
