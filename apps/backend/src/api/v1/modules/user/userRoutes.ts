import express from "express";

import userController from "./userController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const userRoutes = express.Router();
userRoutes.use(requireAuth);

userRoutes.post("/update-role", userController.updateUserRole);

export default userRoutes;
