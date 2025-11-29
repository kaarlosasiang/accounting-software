import { toNodeHandler } from "better-auth/node";
import { Router } from "express";

import { authServer } from "../modules/auth/betterAuth";

const router = Router();

// Express v5: Use * wildcard without leading slash for catch-all
// This catches all routes like /sign-up/email, /sign-in/email, /ok, etc.
router.all("/*splat", toNodeHandler(authServer));

export default router;
