import { Document } from "mongoose";

import { IFeatures, PlanType } from "./ISubscription";

/**
 * Subscription Plan Document Interface
 * Defines the available subscription tiers and their features
 */
export interface ISubscriptionPlan {
  _id: string;
  planType: PlanType;
  planName: string; // 'Free', 'Pro', 'Premium'
  description: string;

  // Pricing
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string; // default: 'PHP'

  // Features and limits (same structure as Subscription.features)
  features: IFeatures;

  // Plan metadata
  isActive: boolean;
  displayOrder: number; // For sorting in UI
  isPopular: boolean; // Highlight as "Most Popular"
  trialDays: number; // Number of trial days offered

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Plan Document (Mongoose)
 */
export interface ISubscriptionPlanDocument
  extends Omit<ISubscriptionPlan, "_id">,
    Document {}
