import mongoose from "mongoose";

import logger from "../../config/logger.js";
import User from "../../models/User.js";

/**
 * Subscription state lives on the better-auth `users` documents. It is read
 * and written through the app's mongoose connection (same database) rather
 * than a dedicated MongoClient, so the service no longer opens its own
 * connection pool.
 */
const usersCollection = () => User.collection;
const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const subscriptionService = {
  // Define your service methods here

  activateSubscription: async (userId: string, planId: string) => {
    try {
      // Update user with subscription details using native MongoDB driver
      // This ensures we update the same collection Better Auth uses
      const result = await usersCollection().updateOne(
        { _id: toObjectId(userId) },
        {
          $set: {
            hasActiveSubscription: true,
            subscriptionPlan: planId,
            subscriptionStatus: "active",
            subscriptionActivatedAt: new Date(),
          },
        },
      );

      logger.info("Subscription activated", { userId, planId, result });

      return result;
    } catch (error) {
      logger.error("Failed to activate subscription", {
        userId,
        planId,
        error,
      });
      throw error;
    }
  },

  getSubscription: async (userId: string) => {
    try {
      const user = await usersCollection().findOne(
        { _id: toObjectId(userId) },
        {
          projection: {
            hasActiveSubscription: 1,
            subscriptionPlan: 1,
            subscriptionStatus: 1,
          },
        },
      );

      return user;
    } catch (error) {
      logger.error("Failed to get subscription", { userId, error });
      throw error;
    }
  },

  cancelSubscription: async (userId: string) => {
    try {
      const result = await usersCollection().updateOne(
        { _id: toObjectId(userId) },
        {
          $set: {
            hasActiveSubscription: false,
            subscriptionStatus: "cancelled",
            subscriptionCancelledAt: new Date(),
          },
        },
      );

      logger.info("Subscription cancelled", { userId, result });

      return result;
    } catch (error) {
      logger.error("Failed to cancel subscription", { userId, error });
      throw error;
    }
  },
};

export default subscriptionService;
