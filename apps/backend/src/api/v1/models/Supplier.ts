import mongoose, { Schema } from "mongoose";

import { IAddress } from "../shared/interface/IAddress";
import { ISupplier, ISupplierDocument } from "../shared/interface/ISupplier";

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
 * Supplier Schema
 */
const SupplierSchema = new Schema<ISupplier>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    supplierCode: {
      type: String,
      required: [true, "Supplier code is required"],
      trim: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: null,
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
      type: Date,
      default: null,
    },
    address: {
      type: AddressSchema,
      required: [true, "Address is required"],
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
    openingBalance: {
      type: Number,
      required: [true, "Opening balance is required"],
      default: 0,
    },
    currentBalance: {
      type: Number,
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
    collection: "suppliers",
  },
);

/**
 * Indexes for performance
 */
SupplierSchema.index({ companyId: 1, supplierCode: 1 }, { unique: true });
SupplierSchema.index({ companyId: 1, email: 1 });
SupplierSchema.index({ companyId: 1, isActive: 1 });
SupplierSchema.index({ companyId: 1, supplierName: 1 });

/**
 * Virtual: Full address
 */
SupplierSchema.virtual("fullAddress").get(function () {
  if (!this.address) return "";
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}, ${this.address.country}`;
});

/**
 * Pre-save: Auto-populate displayName if not provided
 */
SupplierSchema.pre("save", function () {
  if (!this.displayName && this.supplierName) {
    this.displayName = this.supplierName;
  }
});

/**
 * Instance method: Update balance
 */
SupplierSchema.methods.updateBalance = function (amount: number) {
  this.currentBalance += amount;
  return this.save();
};

/**
 * Static method: Find active suppliers
 */
SupplierSchema.statics.findActive = function (
  companyId: mongoose.Types.ObjectId,
) {
  return this.find({ companyId, isActive: true }).sort({ supplierName: 1 });
};

/**
 * Static method: Find by supplier code
 */
SupplierSchema.statics.findBySupplierCode = function (
  companyId: mongoose.Types.ObjectId,
  supplierCode: string,
) {
  return this.findOne({ companyId, supplierCode });
};

/**
 * Static method: Search suppliers by name or email
 */
SupplierSchema.statics.searchSuppliers = function (
  companyId: mongoose.Types.ObjectId,
  searchTerm: string,
) {
  const regex = new RegExp(searchTerm, "i");
  return this.find({
    companyId,
    $or: [
      { supplierName: regex },
      { displayName: regex },
      { email: regex },
      { supplierCode: regex },
    ],
  }).sort({ supplierName: 1 });
};

/**
 * Export the model
 */
export const Supplier =
  (mongoose.models.Supplier as mongoose.Model<ISupplierDocument>) ||
  mongoose.model<ISupplierDocument>("Supplier", SupplierSchema as any);
