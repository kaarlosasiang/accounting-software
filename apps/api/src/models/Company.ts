import { Schema, model, Document, Types } from "mongoose";

/**
 * Company document interface
 */
export interface ICompany extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  taxId?: string;
  registrationNumber?: string;
  industry?: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  settings: {
    currency: string;
    timezone: string;
    fiscalYearStart: number; // Month (1-12)
    dateFormat: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Company schema
 */
const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Company email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s()-]+$/, "Please provide a valid phone number"],
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: "United States",
      },
    },
    taxId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
        "Please provide a valid URL",
      ],
    },
    logo: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      currency: {
        type: String,
        default: "USD",
        uppercase: true,
      },
      timezone: {
        type: String,
        default: "America/New_York",
      },
      fiscalYearStart: {
        type: Number,
        min: 1,
        max: 12,
        default: 1, // January
      },
      dateFormat: {
        type: String,
        default: "MM/DD/YYYY",
        enum: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
      },
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
  }
);

// Virtual for full address
companySchema.virtual("fullAddress").get(function (this: ICompany) {
  if (!this.address) return null;
  const { street, city, state, zipCode, country } = this.address;
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
});

// Indexes for faster queries
companySchema.index({ email: 1 });
companySchema.index({ name: 1 });
companySchema.index({ taxId: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ createdAt: -1 });

/**
 * Company model
 */
const Company = model<ICompany>("Company", companySchema);

export default Company;
