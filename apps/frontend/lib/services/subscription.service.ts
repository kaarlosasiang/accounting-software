import { authClient } from "@/lib/config/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export interface ActivateSubscriptionData {
  userId: string;
  planId: string;
}

export interface SubscriptionResponse {
  success: boolean;
  message?: string;
  data?: {
    hasActiveSubscription: boolean;
    subscriptionPlan: string;
    subscriptionStatus: string;
  };
  error?: string;
}

class SubscriptionService {
  /**
   * Activate a subscription for a user (mock)
   */
  async activateSubscription(
    data: ActivateSubscriptionData
  ): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${API_URL}/subscriptions/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to activate subscription");
      }

      // Refresh the session to get updated user data
      await authClient.getSession();

      return result;
    } catch (error) {
      console.error("Error activating subscription:", error);
      throw error;
    }
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(
        `${API_URL}/subscriptions/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch subscription status");
      }

      return result;
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      throw error;
    }
  }

  /**
   * Cancel subscription for a user
   */
  async cancelSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(
        `${API_URL}/subscriptions/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to cancel subscription");
      }

      // Refresh the session to get updated user data
      await authClient.getSession();

      return result;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  }

  /**
   * Mock checkout - simulates payment processing
   */
  async mockCheckout(planId: string, userId: string): Promise<boolean> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock success (in production, this would integrate with payment gateway)
    return true;
  }
}

export const subscriptionService = new SubscriptionService();
