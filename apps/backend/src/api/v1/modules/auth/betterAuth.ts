import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, emailOTP, oneTap, organization } from "better-auth/plugins";
import { MongoClient } from "mongodb";

import { constants } from "../../config/index.js";
import logger from "../../config/logger.js";
import { EmailService } from "../../services/email.service.js";

const mongoClient = new MongoClient(constants.mongodbUri, {
  maxPoolSize: 5,
});

const db = mongoClient.db(constants.dbName);

// Create a proxy to intercept collection calls and rename collections
const dbProxy = new Proxy(db, {
  get(target, prop, receiver) {
    if (prop === "collection") {
      return function (name: string, options?: any) {
        // Redirect "user" collection to "users"
        // Redirect "organization" collection to "company"
        let collectionName = name;
        if (name === "user") collectionName = "users";
        if (name === "organization") collectionName = "company";
        return target.collection(collectionName, options);
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});

export const authServer = betterAuth({
  appUrl: constants.frontEndUrl, // Frontend URL for redirects
  baseURL: constants.betterAuthUrl, // API auth endpoint
  secret: constants.betterAuthSecret,
  trustedOrigins: [
    constants.frontEndUrl,
    constants.corsOrigin,
    "https://www.amfintrass.com",
    "https://amfintrass.com",
    "https://app.fintrass.com",
  ],
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
      // Subscription fields
      hasActiveSubscription: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      subscriptionPlan: { type: "string", required: false },
      subscriptionStatus: { type: "string", required: false },
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
      sameSite: constants.nodeEnv === "production" ? "none" : "lax",
      secure: constants.nodeEnv === "production",
    },
  },
  database: mongodbAdapter(dbProxy as any, { client: mongoClient }),
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        // Send company invitation email
        const inviteLink = `${constants.frontEndUrl}/accept-invitation/${data.id}`;
        EmailService.sendCompanyInvitation({
          email: data.email,
          invitedByUsername: data.inviter.user.name,
          invitedByEmail: data.inviter.user.email,
          companyName: data.organization.name,
          inviteLink,
        }).catch((error) => {
          logger.error("Failed to send company invitation", {
            error,
            email: data.email,
          });
        });
      },
      allowUserToCreateOrganization: true,
      organizationLimit: 5, // Max 5 companies per user
      creatorRole: "owner",
      membershipLimit: 100, // Max 100 members per organization
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      requireEmailVerificationOnInvitation: false,
      // Map organization to Company entity with additional fields
      schema: {
        organization: {
          modelName: "company", // Use 'company' collection for accounting terminology
          additionalFields: {
            // Simple scalar fields as additionalFields for direct querying
            businessType: {
              type: "string",
              required: false,
              input: true,
            },
            taxId: {
              type: "string",
              required: false,
              input: true,
            },
            // Note: address, contact, industry, companySize go in metadata (built-in field)
            fiscalYearStart: {
              type: "string", // ISO date string
              required: false,
              input: true,
            },
            currency: {
              type: "string",
              required: false,
              defaultValue: "PESO",
              input: true,
            },
            headerText: {
              type: "string",
              required: false,
              input: true,
            },
            isActive: {
              type: "boolean",
              required: false,
              defaultValue: true,
              input: true,
            },
          },
        },
      },
    }),
    admin({
      defaultRole: "user",
      // adminRoles: ["admin"], // TODO: Configure admin roles properly
      impersonationSessionDuration: 60 * 60, // 1 hour
      defaultBanReason: "Violated terms of service",
      bannedUserMessage:
        "Your account has been suspended. Please contact support if you believe this is an error.",
      allowImpersonatingAdmins: false,
    }),
    oneTap({
      disableSignup: false,
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Send OTP via email service (non-blocking to prevent timing attacks)
        EmailService.sendVerificationOTP({ email, otp, type }).catch(
          (error) => {
            logger.error("Failed to send OTP email", { error, email, type });
          },
        );
      },
      otpLength: 6, // 6-digit OTP
      expiresIn: 300, // 5 minutes
      sendVerificationOnSignUp: true, // Auto-send verification on signup
      disableSignUp: false, // Allow signup via OTP
      allowedAttempts: 3, // Max 3 verification attempts per OTP
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
