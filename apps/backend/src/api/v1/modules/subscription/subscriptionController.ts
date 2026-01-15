import { Request, Response } from "express";
import {
  subscriptionActivationSchema,
  subscriptionCancellationSchema,
} from "@rrd10-sas/validators";

import subscriptionService from "./subscriptionService";

const subscriptionController = {
  // Define your controller methods here

  activateSubscription: async (req: Request, res: Response) => {
    try {
      const { userId, planId } = req.body;

      // Validate input
      const validationResult = subscriptionActivationSchema.safeParse({
        userId,
        planId,
      });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const result = await subscriptionService.activateSubscription(
        validationResult.data.userId,
        validationResult.data.planId
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Subscription activated successfully",
        data: {
          hasActiveSubscription: true,
          subscriptionPlan: validationResult.data.planId,
          subscriptionStatus: "active",
        },
      });
    } catch (error) {
      console.error("Error activating subscription:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to activate subscription",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  getSubscription: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const subscription = await subscriptionService.getSubscription(userId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          hasActiveSubscription: subscription.hasActiveSubscription || false,
          subscriptionPlan: subscription.subscriptionPlan || null,
          subscriptionStatus: subscription.subscriptionStatus || null,
        },
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch subscription",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  cancelSubscription: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Validate input
      const validationResult = subscriptionCancellationSchema.safeParse({
        userId,
      });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        });
      }

      const result = await subscriptionService.cancelSubscription(
        validationResult.data.userId
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Subscription cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to cancel subscription",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};

export default subscriptionController;
