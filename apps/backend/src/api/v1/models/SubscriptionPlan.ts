import mongoose, { Schema } from "mongoose";

import {
  BillingCycle,
  IFeatures,
  PlanType,
} from "../shared/interface/ISubscription";
import {
  ISubscriptionPlan,
  ISubscriptionPlanDocument,
} from "../shared/interface/ISubscriptionPlan";

/**
 * Features Schema (reused from Subscription)
 */
const FeaturesSchema = new Schema<IFeatures>(
  {
    maxUsers: { type: Schema.Types.Mixed, required: true },
    maxCompanies: { type: Number, required: true },
    maxInvoicesPerMonth: { type: Schema.Types.Mixed, required: true },
    maxCustomers: { type: Number, required: true },
    maxSuppliers: { type: Number, required: true },
    maxInventoryItems: { type: Number, required: true },
    inventoryManagement: { type: Boolean, required: true },
    multiCompany: { type: Boolean, required: true },
    advancedReports: { type: Boolean, required: true },
    financialStatements: { type: Boolean, required: true },
    exportReports: { type: Boolean, required: true },
    customization: { type: Boolean, required: true },
    auditLog: { type: Boolean, required: true },
    autoBackup: { type: Boolean, required: true },
    apiAccess: { type: Boolean, required: true },
    prioritySupport: { type: Boolean, required: true },
    removeBranding: { type: Boolean, required: true },
    customLogo: { type: Boolean, required: true },
    dataRetentionMonths: { type: Schema.Types.Mixed, required: true },
    backupFrequency: { type: String, default: null },
    storageGB: { type: Number, required: true },
  },
  { _id: false },
);

/**
 * Subscription Plan Schema
 */
const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    planType: {
      type: String,
      required: [true, "Plan type is required"],
      enum: {
        values: Object.values(PlanType),
        message: "Invalid plan type",
      },
      unique: true,
      index: true,
    },
    planName: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: [true, "Monthly price is required"],
      min: [0, "Monthly price cannot be negative"],
    },
    yearlyPrice: {
      type: Number,
      required: [true, "Yearly price is required"],
      min: [0, "Yearly price cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "PHP",
      trim: true,
    },
    features: {
      type: FeaturesSchema,
      required: [true, "Features is required"],
    },
    isActive: {
      type: Boolean,
      required: [true, "Active status is required"],
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      required: [true, "Display order is required"],
      default: 0,
    },
    isPopular: {
      type: Boolean,
      required: [true, "Popular flag is required"],
      default: false,
    },
    trialDays: {
      type: Number,
      required: [true, "Trial days is required"],
      default: 14,
      min: [0, "Trial days cannot be negative"],
    },
  },
  {
    timestamps: true,
    collection: "subscriptionPlans",
  },
);

/**
 * Indexes for performance
 */
SubscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });

/**
 * Virtual: Monthly savings percentage for yearly plan
 */
SubscriptionPlanSchema.virtual("yearlySavingsPercent").get(function () {
  if (this.monthlyPrice === 0) return 0;
  const yearlyEquivalent = this.monthlyPrice * 12;
  return Math.round(
    ((yearlyEquivalent - this.yearlyPrice) / yearlyEquivalent) * 100,
  );
});

/**
 * Instance method: Get price for billing cycle
 */
SubscriptionPlanSchema.methods.getPriceForCycle = function (
  cycle: BillingCycle,
): number {
  return cycle === BillingCycle.MONTHLY ? this.monthlyPrice : this.yearlyPrice;
};

/**
 * Instance method: Check if feature is enabled
 */
SubscriptionPlanSchema.methods.hasFeature = function (
  featureName: keyof IFeatures,
): boolean {
  return !!this.features[featureName];
};

/**
 * Instance method: Get feature limit
 */
SubscriptionPlanSchema.methods.getFeatureLimit = function (
  featureName: keyof IFeatures,
): number | string {
  return this.features[featureName];
};

/**
 * Static method: Find active plans
 */
SubscriptionPlanSchema.statics.findActivePlans = function () {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

/**
 * Static method: Find plan by type
 */
SubscriptionPlanSchema.statics.findByPlanType = function (planType: PlanType) {
  return this.findOne({ planType, isActive: true });
};

/**
 * Static method: Get popular plan
 */
SubscriptionPlanSchema.statics.getPopularPlan = function () {
  return this.findOne({ isPopular: true, isActive: true });
};

/**
 * Static method: Compare plans
 */
SubscriptionPlanSchema.statics.comparePlans = async function (
  planType1: PlanType,
  planType2: PlanType,
) {
  const plans = await this.find({
    planType: { $in: [planType1, planType2] },
    isActive: true,
  });

  if (plans.length !== 2) {
    throw new Error("One or both plans not found");
  }

  return {
    plan1: plans.find(
      (p: ISubscriptionPlanDocument) => p.planType === planType1,
    ),
    plan2: plans.find(
      (p: ISubscriptionPlanDocument) => p.planType === planType2,
    ),
  };
};

/**
 * Static method: Initialize default plans
 */
SubscriptionPlanSchema.statics.initializeDefaultPlans = async function () {
  const existingPlans = await this.countDocuments();
  if (existingPlans > 0) return;

  const defaultPlans = [
    {
      planType: PlanType.FREE,
      planName: "Free",
      description: "Perfect for getting started with basic accounting",
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: "PHP",
      features: {
        maxUsers: 1,
        maxCompanies: 1,
        maxInvoicesPerMonth: 10,
        maxCustomers: 10,
        maxSuppliers: 10,
        maxInventoryItems: 50,
        inventoryManagement: false,
        multiCompany: false,
        advancedReports: false,
        financialStatements: false,
        exportReports: false,
        customization: false,
        auditLog: false,
        autoBackup: false,
        apiAccess: false,
        prioritySupport: false,
        removeBranding: false,
        customLogo: false,
        dataRetentionMonths: 3,
        backupFrequency: null,
        storageGB: 1,
      },
      isActive: true,
      displayOrder: 1,
      isPopular: false,
      trialDays: 0,
    },
    {
      planType: PlanType.PRO,
      planName: "Pro",
      description: "For growing businesses with advanced needs",
      monthlyPrice: 999,
      yearlyPrice: 9990, // ~17% discount
      currency: "PHP",
      features: {
        maxUsers: 5,
        maxCompanies: 3,
        maxInvoicesPerMonth: 500,
        maxCustomers: 500,
        maxSuppliers: 200,
        maxInventoryItems: 1000,
        inventoryManagement: true,
        multiCompany: true,
        advancedReports: true,
        financialStatements: true,
        exportReports: true,
        customization: true,
        auditLog: true,
        autoBackup: true,
        apiAccess: false,
        prioritySupport: false,
        removeBranding: false,
        customLogo: false,
        dataRetentionMonths: 12,
        backupFrequency: "weekly",
        storageGB: 10,
      },
      isActive: true,
      displayOrder: 2,
      isPopular: true,
      trialDays: 14,
    },
    {
      planType: PlanType.PREMIUM,
      planName: "Premium",
      description: "Enterprise-grade features for unlimited growth",
      monthlyPrice: 2499,
      yearlyPrice: 24990, // ~17% discount
      currency: "PHP",
      features: {
        maxUsers: "unlimited",
        maxCompanies: 10,
        maxInvoicesPerMonth: "unlimited",
        maxCustomers: 10000,
        maxSuppliers: 5000,
        maxInventoryItems: 50000,
        inventoryManagement: true,
        multiCompany: true,
        advancedReports: true,
        financialStatements: true,
        exportReports: true,
        customization: true,
        auditLog: true,
        autoBackup: true,
        apiAccess: true,
        prioritySupport: true,
        removeBranding: true,
        customLogo: true,
        dataRetentionMonths: "unlimited",
        backupFrequency: "daily",
        storageGB: 100,
      },
      isActive: true,
      displayOrder: 3,
      isPopular: false,
      trialDays: 30,
    },
  ];

  return this.insertMany(defaultPlans);
};

/**
 * Export the model
 */
export const SubscriptionPlan =
  (mongoose.models
    .SubscriptionPlan as mongoose.Model<ISubscriptionPlanDocument>) ||
  mongoose.model<ISubscriptionPlanDocument>(
    "SubscriptionPlan",
    SubscriptionPlanSchema as any,
  );
