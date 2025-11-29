import mongoose, { Schema } from "mongoose";

import {
  BillingCycle,
  IBillingHistoryItem,
  ICurrentUsage,
  IFeatures,
  IPaymentMethod,
  ISubscription,
  ISubscriptionDocument,
  PlanType,
  SubscriptionStatus,
} from "../shared/interface/ISubscription";

/**
 * Current Usage Schema
 */
const CurrentUsageSchema = new Schema<ICurrentUsage>(
  {
    users: { type: Number, default: 0 },
    companies: { type: Number, default: 0 },
    invoicesThisMonth: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    suppliers: { type: Number, default: 0 },
    inventoryItems: { type: Number, default: 0 },
    storageUsedGB: { type: Number, default: 0 },
    transactionsThisMonth: { type: Number, default: 0 },
    reportsThisMonth: { type: Number, default: 0 },
  },
  { _id: false },
);

/**
 * Features Schema
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
 * Payment Method Schema
 */
const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    type: { type: String, required: true, trim: true },
    last4: { type: String, required: true, trim: true },
    expiryDate: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/**
 * Billing History Schema
 */
const BillingHistorySchema = new Schema<IBillingHistoryItem>(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true, trim: true },
    invoiceUrl: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/**
 * Subscription Schema
 */
const SubscriptionSchema = new Schema<ISubscription>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      unique: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
      index: true,
    },
    planType: {
      type: String,
      required: [true, "Plan type is required"],
      enum: {
        values: Object.values(PlanType),
        message: "Invalid plan type",
      },
      index: true,
    },
    planName: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: Object.values(SubscriptionStatus),
        message: "Invalid status",
      },
      default: SubscriptionStatus.TRIAL,
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "PHP",
      trim: true,
    },
    billingCycle: {
      type: String,
      required: [true, "Billing cycle is required"],
      enum: {
        values: Object.values(BillingCycle),
        message: "Invalid billing cycle",
      },
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      index: true,
    },
    trialEndDate: {
      type: Date,
      required: [true, "Trial end date is required"],
    },
    nextBillingDate: {
      type: Date,
      required: [true, "Next billing date is required"],
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    currentUsage: {
      type: CurrentUsageSchema,
      required: [true, "Current usage is required"],
      default: {},
    },
    features: {
      type: FeaturesSchema,
      required: [true, "Features is required"],
    },
    autoRenew: {
      type: Boolean,
      required: [true, "Auto renew is required"],
      default: true,
    },
    paymentMethod: {
      type: PaymentMethodSchema,
      required: [true, "Payment method is required"],
    },
    billingHistory: {
      type: [BillingHistorySchema],
      required: [true, "Billing history is required"],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "subscriptions",
  },
);

/**
 * Indexes for performance
 */
SubscriptionSchema.index({ ownerId: 1 });
SubscriptionSchema.index({ status: 1, endDate: 1 });
SubscriptionSchema.index({ status: 1, nextBillingDate: 1 });

/**
 * Virtual: Is Active
 */
SubscriptionSchema.virtual("isActive").get(function () {
  return this.status === SubscriptionStatus.ACTIVE;
});

/**
 * Virtual: Is Trial
 */
SubscriptionSchema.virtual("isTrial").get(function () {
  return this.status === SubscriptionStatus.TRIAL;
});

/**
 * Virtual: Days Until Expiry
 */
SubscriptionSchema.virtual("daysUntilExpiry").get(function () {
  const now = new Date();
  const diff = this.endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

/**
 * Pre-save: Update status based on dates
 */
SubscriptionSchema.pre("save", function () {
  const now = new Date();

  if (this.status === SubscriptionStatus.CANCELLED) return;

  if (this.trialEndDate && now < this.trialEndDate) {
    this.status = SubscriptionStatus.TRIAL;
  } else if (now > this.endDate) {
    this.status = SubscriptionStatus.EXPIRED;
  } else if (
    this.status !== SubscriptionStatus.SUSPENDED &&
    now >= this.startDate &&
    now <= this.endDate
  ) {
    this.status = SubscriptionStatus.ACTIVE;
  }
});

/**
 * Instance method: Cancel subscription
 */
SubscriptionSchema.methods.cancel = function () {
  this.status = SubscriptionStatus.CANCELLED;
  this.cancelledAt = new Date();
  this.autoRenew = false;
  return this.save();
};

/**
 * Instance method: Suspend subscription
 */
SubscriptionSchema.methods.suspend = function () {
  if (this.status === SubscriptionStatus.CANCELLED) {
    throw new Error("Cannot suspend a cancelled subscription");
  }
  this.status = SubscriptionStatus.SUSPENDED;
  return this.save();
};

/**
 * Instance method: Reactivate subscription
 */
SubscriptionSchema.methods.reactivate = function () {
  if (this.status === SubscriptionStatus.CANCELLED) {
    throw new Error("Cannot reactivate a cancelled subscription");
  }
  this.status = SubscriptionStatus.ACTIVE;
  return this.save();
};

/**
 * Instance method: Upgrade plan
 */
SubscriptionSchema.methods.upgradePlan = function (
  newPlanType: PlanType,
  newFeatures: IFeatures,
  newPrice: number,
) {
  this.planType = newPlanType;
  this.features = newFeatures;
  this.price = newPrice;
  return this.save();
};

/**
 * Instance method: Check usage limit
 */
SubscriptionSchema.methods.checkUsageLimit = function (
  resource: keyof ICurrentUsage,
): boolean {
  const currentValue = this.currentUsage[resource];
  const featureKey =
    `max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof IFeatures;
  const limit = this.features[featureKey];

  if (limit === "unlimited") return true;
  return currentValue < (limit as number);
};

/**
 * Instance method: Update usage
 */
SubscriptionSchema.methods.updateUsage = function (
  resource: keyof ICurrentUsage,
  value: number,
) {
  this.currentUsage[resource] = value;
  return this.save();
};

/**
 * Instance method: Add billing history
 */
SubscriptionSchema.methods.addBillingHistory = function (
  item: IBillingHistoryItem,
) {
  this.billingHistory.push(item);
  return this.save();
};

/**
 * Static method: Find active subscriptions
 */
SubscriptionSchema.statics.findActive = function () {
  return this.find({ status: SubscriptionStatus.ACTIVE }).sort({
    endDate: 1,
  });
};

/**
 * Static method: Find expiring soon
 */
SubscriptionSchema.statics.findExpiringSoon = function (days = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    status: SubscriptionStatus.ACTIVE,
    endDate: { $gte: now, $lte: futureDate },
  }).sort({ endDate: 1 });
};

/**
 * Static method: Find by owner
 */
SubscriptionSchema.statics.findByOwner = function (
  ownerId: mongoose.Types.ObjectId,
) {
  return this.find({ ownerId }).sort({ createdAt: -1 });
};

/**
 * Static method: Find by plan type
 */
SubscriptionSchema.statics.findByPlanType = function (planType: PlanType) {
  return this.find({ planType, status: SubscriptionStatus.ACTIVE }).sort({
    startDate: -1,
  });
};

/**
 * Static method: Get revenue summary
 */
SubscriptionSchema.statics.getRevenueSummary = async function (
  startDate: Date,
  endDate: Date,
) {
  const result = await this.aggregate([
    {
      $match: {
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$planType",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$price" },
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
  ]);

  return result;
};

/**
 * Export the model
 */
export const Subscription =
  (mongoose.models.Subscription as mongoose.Model<ISubscriptionDocument>) ||
  mongoose.model<ISubscriptionDocument>(
    "Subscription",
    SubscriptionSchema as any,
  );
