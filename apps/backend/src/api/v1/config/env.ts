import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFiles = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

/**
 * Validate critical environment variables on startup
 * Throws error if required variables are missing in production
 */
function validateEnv() {
  const required = ["MONGODB_URI"];

  if (process.env.NODE_ENV === "production") {
    required.push("JWT_SECRET", "BETTER_AUTH_SECRET", "FRONTEND_URL");
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  // Validate secret lengths in production
  if (process.env.NODE_ENV === "production") {
    if (
      process.env.BETTER_AUTH_SECRET &&
      process.env.BETTER_AUTH_SECRET.length < 32
    ) {
      throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters");
    }
  }
}

// Run validation on module load
validateEnv();

export default dotenv;
