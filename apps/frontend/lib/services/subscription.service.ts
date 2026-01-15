import { authClient } from "@/lib/config/auth-client";
import { apiFetch } from "@/lib/config/api-client";

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
      const result = await apiFetch<SubscriptionResponse>(
        "/subscriptions/activate",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      // Force refresh the session to get updated user data (bypass cookie cache)
      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });

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
      const result = await apiFetch<SubscriptionResponse>(
        `/subscriptions/${userId}`,
        {
          method: "GET",
        }
      );

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
      const result = await apiFetch<SubscriptionResponse>(
        `/subscriptions/${userId}`,
        {
          method: "DELETE",
        }
      );

      // Force refresh the session to get updated user data (bypass cookie cache)
      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });

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
