import { z } from "zod";

// Subscription activation schema
export const subscriptionActivationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  planId: z.string().min(1, "Plan ID is required"),
});

// Subscription cancellation schema
export const subscriptionCancellationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// Export types inferred from schemas
export type SubscriptionActivation = z.infer<
  typeof subscriptionActivationSchema
>;
export type SubscriptionCancellation = z.infer<
  typeof subscriptionCancellationSchema
>;
