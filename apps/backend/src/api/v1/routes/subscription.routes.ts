import express from "express";
import { MongoClient, ObjectId } from "mongodb";

import { constants } from "../config";

const router = express.Router();

// MongoDB connection for subscription operations
const mongoClient = new MongoClient(constants.mongodbUri);
const db = mongoClient.db(constants.dbName);
const usersCollection = db.collection("user");

/**
 * Mock endpoint to activate subscription
 * POST /api/v1/subscriptions/activate
 */
router.post("/activate", async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: "userId and planId are required",
      });
    }

    // Mock subscription activation - update user with subscription details
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          hasActiveSubscription: true,
          subscriptionPlan: planId,
          subscriptionStatus: "active",
          subscriptionActivatedAt: new Date(),
        },
      },
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
});

/**
 * Mock endpoint to get subscription status
 * GET /api/v1/subscriptions/:userId
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        hasActiveSubscription: user.hasActiveSubscription || false,
        subscriptionPlan: user.subscriptionPlan || null,
        subscriptionStatus: user.subscriptionStatus || null,
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
});

/**
 * Mock endpoint to update user role and companyId after company setup
 * POST /api/v1/subscriptions/update-user-role
 */
router.post("/update-user-role", async (req, res) => {
  try {
    const { userId, role, companyId } = req.body;

    if (!userId || !role || !companyId) {
      return res.status(400).json({
        success: false,
        message: "userId, role, and companyId are required",
      });
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          companyId,
          companySetupCompletedAt: new Date(),
        },
      },
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
        role,
        companyId,
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
});

/**
 * Mock endpoint to cancel subscription
 * DELETE /api/v1/subscriptions/:userId
 */
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          hasActiveSubscription: false,
          subscriptionStatus: "cancelled",
          subscriptionCancelledAt: new Date(),
        },
      },
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
});

export default router;
