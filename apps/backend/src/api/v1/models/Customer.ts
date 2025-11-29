import mongoose, { Schema } from "mongoose";

import { IAddress } from "../shared/interface/IAddress";
import { ICustomer, ICustomerDocument } from "../shared/interface/ICustomer";

/**
 * Address Schema
 */
const AddressSchema = new Schema<IAddress>(
  {
    street: {
      type: String,
      required: [true, "Street is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, "Zip code is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
  },
  { _id: false },
);

/**
 * Customer Schema
 */
const CustomerSchema = new Schema<ICustomer>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    customerCode: {
      type: String,
      required: [true, "Customer code is required"],
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    billingAddress: {
      type: AddressSchema,
      required: [true, "Billing address is required"],
    },
    shippingAddress: {
      type: AddressSchema,
      default: null,
    },
    taxId: {
      type: String,
      required: [true, "Tax ID is required"],
      trim: true,
    },
    paymentTerms: {
      type: String,
      required: [true, "Payment terms is required"],
      trim: true,
    },
    creditLimit: {
      type: Number,
      required: [true, "Credit limit is required"],
      default: 0,
      min: [0, "Credit limit cannot be negative"],
    },
    openingBalance: {
      type: Number,
      required: [true, "Opening balance is required"],
      default: 0,
    },
    currentBalance: {
      type: Number,
      required: [true, "Current balance is required"],
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: [true, "Active status is required"],
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "customers",
  },
);

/**
 * Indexes for performance
 */
CustomerSchema.index({ companyId: 1, customerCode: 1 }, { unique: true });
CustomerSchema.index({ companyId: 1, email: 1 });
CustomerSchema.index({ companyId: 1, isActive: 1 });
CustomerSchema.index({ companyId: 1, customerName: 1 });

/**
 * Virtual: Full billing address
 */
CustomerSchema.virtual("fullBillingAddress").get(function () {
  if (!this.billingAddress) return "";
  return `${this.billingAddress.street}, ${this.billingAddress.city}, ${this.billingAddress.state} ${this.billingAddress.zipCode}, ${this.billingAddress.country}`;
});

/**
 * Virtual: Full shipping address
 */
CustomerSchema.virtual("fullShippingAddress").get(function () {
  if (!this.shippingAddress) return "";
  return `${this.shippingAddress.street}, ${this.shippingAddress.city}, ${this.shippingAddress.state} ${this.shippingAddress.zipCode}, ${this.shippingAddress.country}`;
});

/**
 * Virtual: Available credit
 */
CustomerSchema.virtual("availableCredit").get(function () {
  return Math.max(0, this.creditLimit - this.currentBalance);
});

/**
 * Instance method: Update balance
 */
CustomerSchema.methods.updateBalance = function (amount: number) {
  this.currentBalance += amount;
  return this.save();
};

/**
 * Instance method: Check credit availability
 */
CustomerSchema.methods.hasCreditAvailable = function (amount: number) {
  return this.currentBalance + amount <= this.creditLimit;
};

/**
 * Static method: Find active customers
 */
CustomerSchema.statics.findActive = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.find({ companyId, isActive: true }).sort({ customerName: 1 });
};

/**
 * Static method: Find by customer code
 */
CustomerSchema.statics.findByCustomerCode = function (
  companyId: mongoose.Types.ObjectId,
  customerCode: string,
) {
  return this.findOne({ companyId, customerCode });
};

/**
 * Static method: Search customers by name or email
 */
CustomerSchema.statics.searchCustomers = function (
  companyId: mongoose.Types.ObjectId,
  searchTerm: string,
) {
  const regex = new RegExp(searchTerm, "i");
  return this.find({
    companyId,
    $or: [
      { customerName: regex },
      { displayName: regex },
      { email: regex },
      { customerCode: regex },
    ],
  }).sort({ customerName: 1 });
};

/**
 * Export the model
 */
export const Customer =
  (mongoose.models.Customer as mongoose.Model<ICustomerDocument>) ||
  mongoose.model<ICustomerDocument>("Customer", CustomerSchema as any);
