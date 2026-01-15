import { MongoClient, ObjectId } from "mongodb";

import { constants } from "../../config/index.js";
import logger from "../../config/logger.js";

// Use the same MongoDB connection as Better Auth to ensure we update the correct collection
const mongoClient = new MongoClient(constants.mongodbUri, {
  maxPoolSize: 5,
});

const db = mongoClient.db(constants.dbName);
const usersCollection = db.collection("users");

// Connect to MongoDB
mongoClient.connect().catch((error) => {
  logger.error("Failed to connect to MongoDB for subscription service", {
    error,
  });
});

const subscriptionService = {
  // Define your service methods here

  activateSubscription: async (userId: string, planId: string) => {
    try {
      // Update user with subscription details using native MongoDB driver
      // This ensures we update the same collection Better Auth uses
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            hasActiveSubscription: true,
            subscriptionPlan: planId,
            subscriptionStatus: "active",
            subscriptionActivatedAt: new Date(),
          },
        }
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
      const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        {
          projection: {
            hasActiveSubscription: 1,
            subscriptionPlan: 1,
            subscriptionStatus: 1,
          },
        }
      );

      return user;
    } catch (error) {
      logger.error("Failed to get subscription", { userId, error });
      throw error;
    }
  },

  cancelSubscription: async (userId: string) => {
    try {
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            hasActiveSubscription: false,
            subscriptionStatus: "cancelled",
            subscriptionCancelledAt: new Date(),
          },
        }
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
