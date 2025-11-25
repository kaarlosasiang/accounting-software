import { Schema, model, Document, Types } from "mongoose";

/**
 * User document interface
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user" | "accountant";
  company?: Types.ObjectId;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User schema
 */
const userSchema = new Schema<IUser>(
  {
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
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "user", "accountant"],
        message: "{VALUE} is not a valid role",
      },
      default: "user",
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        const { password, __v, ...rest } = ret;
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
  return `${this.firstName} ${this.lastName}`;
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ company: 1 });
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
