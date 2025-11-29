import { model, Schema } from "mongoose";

import { IAccount } from "../shared/interface/IAccount";

/**
 * Account schema
 */
const accountSchema = new Schema<IAccount>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: [true, "Company ID is required"],
      ref: "Company",
    },
    accountCode: {
      type: String,
      required: [true, "Account code is required"],
      trim: true,
      match: [/^\d+$/, "Account code must be numeric (e.g., '1000', '2000')"],
    },
    accountName: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      maxlength: [100, "Account name cannot exceed 100 characters"],
    },
    accountType: {
      type: String,
      required: [true, "Account type is required"],
      enum: {
        values: ["Asset", "Liability", "Equity", "Revenue", "Expense"],
        message: "{VALUE} is not a valid account type",
      },
    },
    subType: {
      type: String,
      trim: true,
      maxlength: [100, "Sub type cannot exceed 100 characters"],
    },
    parentAccount: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    balance: {
      type: Number,
      required: [true, "Balance is required"],
      default: 0,
    },
    normalBalance: {
      type: String,
      required: [true, "Normal balance is required"],
      enum: {
        values: ["Debit", "Credit"],
        message: "{VALUE} is not a valid normal balance",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        const { __v, ...rest } = ret;
        return rest;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// Compound index to ensure unique account code per company
accountSchema.index({ companyId: 1, accountCode: 1 }, { unique: true });

// Indexes for faster queries
accountSchema.index({ companyId: 1 });
accountSchema.index({ accountType: 1 });
accountSchema.index({ parentAccount: 1 });
accountSchema.index({ createdAt: -1 });

/**
 * Account model
 */
const Account = model<IAccount>("Account", accountSchema);

export default Account;
