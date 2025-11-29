import { Document, Types } from "mongoose";

/**
 * Plan Type
 */
export enum PlanType {
  FREE = "FREE",
  PRO = "PRO",
  PREMIUM = "PREMIUM",
}

/**
 * Subscription Status
 */
export enum SubscriptionStatus {
  ACTIVE = "Active",
  EXPIRED = "Expired",
  SUSPENDED = "Suspended",
  CANCELLED = "Cancelled",
  TRIAL = "Trial",
}

/**
 * Billing Cycle
 */
export enum BillingCycle {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

/**
 * Current Usage Interface
 */
export interface ICurrentUsage {
  users: number;
  companies: number;
  invoicesThisMonth: number;
  customers: number;
  suppliers: number;
  inventoryItems: number;
  storageUsedGB: number;
  transactionsThisMonth: number;
  reportsThisMonth: number;
}

/**
 * Features Interface
 */
export interface IFeatures {
  maxUsers: number | "unlimited";
  maxCompanies: number;
  maxInvoicesPerMonth: number | "unlimited";
  maxCustomers: number;
  maxSuppliers: number;
  maxInventoryItems: number;

  // Feature flags
  inventoryManagement: boolean;
  multiCompany: boolean;
  advancedReports: boolean;
  financialStatements: boolean;
  exportReports: boolean;
  customization: boolean;
  auditLog: boolean;
  autoBackup: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  removeBranding: boolean;
  customLogo: boolean;

  // Data
  dataRetentionMonths: number | "unlimited";
  backupFrequency: string | null; // 'daily', 'weekly', null
  storageGB: number;
}

/**
 * Payment Method Interface
 */
export interface IPaymentMethod {
  type: string; // 'card', 'bank', 'paypal'
  last4: string;
  expiryDate: string;
}

/**
 * Billing History Item Interface
 */
export interface IBillingHistoryItem {
  date: Date;
  amount: number;
  status: string; // 'paid', 'failed', 'pending'
  invoiceUrl: string;
}

/**
 * Subscription Document Interface
 */
export interface ISubscription {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  ownerId: Types.ObjectId; // Reference to User (Owner only)
  planType: PlanType;
  planName: string; // 'Free', 'Pro', 'Premium'
  status: SubscriptionStatus;
  price: number;
  currency: string; // Default PHP
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date;
  trialEndDate: Date;
  nextBillingDate: Date;
  cancelledAt: Date | null;
  currentUsage: ICurrentUsage;
  features: IFeatures;
  autoRenew: boolean;
  paymentMethod: IPaymentMethod;
  billingHistory: IBillingHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Document (Mongoose)
 */
export interface ISubscriptionDocument
  extends Omit<ISubscription, "_id">,
    Document {}
