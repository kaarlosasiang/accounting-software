import { model, Schema } from "mongoose";

import { IUser } from "../shared/interface/IUser.js";

/**
 * User schema
 */
const userSchema = new Schema<IUser>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: [true, "Company ID is required"],
      ref: "Company",
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["Owner", "Admin", "Accountant", "User"],
        message: "{VALUE} is not a valid role",
      },
    },
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    middle_name: {
      type: String,
      trim: true,
      maxlength: [50, "Middle name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },
    phone_number: {
      type: Number,
      required: [true, "Phone number is required"],
    },
    token: {
      type: String,
      required: [true, "Token is required"],
      select: false, // Don't include token in queries by default
    },
    token_expiry: {
      type: Date,
      required: [true, "Token expiry is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    last_login_date: {
      type: Date,
    },
    last_activity: {
      type: Date,
      required: [true, "Last activity is required"],
    },
    hasActiveSubscription: {
      type: Boolean,
      default: false,
    },
    subscriptionPlan: {
      type: String,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "cancelled", "expired", null],
      default: null,
    },
    subscriptionActivatedAt: {
      type: Date,
    },
    subscriptionCancelledAt: {
      type: Date,
    },
    companySetupCompletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        const { password, token, __v, ...rest } = ret;
        return rest;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function (this: IUser) {
  const parts = [this.first_name, this.middle_name, this.last_name].filter(
    Boolean
  );
  return parts.join(" ");
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ companyId: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware example (for future use with password hashing)
userSchema.pre("save", async function () {
  // Password hashing will go here when implementing authentication
  // For now, just continue
});

/**
 * User model
 */
const User = model<IUser>("User", userSchema);

export default User;
