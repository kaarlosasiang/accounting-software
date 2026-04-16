import { Request, Response } from "express";
import { z } from "zod";

import userService from "./userService.js";
import { createPersonnelSchema } from "@sas/validators";
import { getCompanyId } from "../../shared/helpers/utils.js";

// Define user role update schema
const userRoleUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.string().min(1, "Role is required"),
  companyId: z.string().min(1, "Company ID is required"),
});

const userController = {
  updateUserRole: async (req: Request, res: Response) => {
    try {
      const { userId, role, companyId } = req.body;

      // Validate input
      const validationResult = userRoleUpdateSchema.safeParse({
        userId,
        role,
        companyId,
      });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const result = await userService.updateUserRole(
        validationResult.data.userId,
        validationResult.data.role,
        validationResult.data.companyId
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User role and company updated successfully",
        data: {
          role: validationResult.data.role,
          companyId: validationResult.data.companyId,
        },
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user role",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * POST /api/v1/users
   * Creates a new user and immediately adds them to the active organisation.
   * The organizationId is read from the session — never from the request body.
   * Requires: Resource.user + Action.create permission.
   */
  createPersonnel: async (req: Request, res: Response) => {
    try {
      const organizationId = getCompanyId(req);
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: "Active company not found in session",
        });
      }

      const parsed = createPersonnelSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.issues,
        });
      }

      const user = await userService.createPersonnel(parsed.data, organizationId);

      return res.status(201).json({
        success: true,
        message: "Personnel created successfully",
        data: user,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create personnel";
      const status = message.includes("already exists") ? 409 : 500;
      return res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

export default userController;
