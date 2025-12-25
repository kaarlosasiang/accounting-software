import { Request, Response } from "express";

import subscriptionService from "./subscriptionService";

const subscriptionController = {
  // Define your controller methods here

  activateSubscription: async (req: Request, res: Response) => {
    try {
      const { userId, planId } = req.body;

      if (!userId || !planId) {
        return res.status(400).json({
          success: false,
          message: "userId and planId are required",
        });
      }

      const result = await subscriptionService.activateSubscription(
        userId,
        planId
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
          subscriptionPlan: planId,
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
};

export default subscriptionController;
