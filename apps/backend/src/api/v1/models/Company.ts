import { model, Schema } from "mongoose";

import { ICompany } from "../shared/interface/ICompany";

/**
 * Company schema
 */
const companySchema = new Schema<ICompany>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: [true, "Owner ID is required"],
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    businessType: {
      type: String,
      required: [true, "Business type is required"],
      trim: true,
    },
    taxId: {
      type: String,
      required: [true, "Tax ID is required"],
      trim: true,
      unique: true,
    },
    address: [
      {
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
        },
      },
    ],
    contact: {
      type: [
        {
          phone: {
            type: String,
            trim: true,
            match: [/^[+]?[\d\s()-]+$/, "Please provide a valid phone number"],
          },
          email: {
            type: String,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
          },
          website: {
            type: String,
            trim: true,
            match: [
              /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
              "Please provide a valid URL",
            ],
          },
        },
      ],
      required: [true, "Contact information is required"],
    },
    fiscalYearStart: {
      type: Date,
      required: [true, "Fiscal year start date is required"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "PESO",
      uppercase: true,
    },
    logo: {
      type: String,
      required: [true, "Logo is required"],
      trim: true,
    },
    headerText: {
      type: String,
      required: [true, "Header text is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: [true, "Active status is required"],
      default: true,
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

// Virtual for full address (returns first address if available)
companySchema.virtual("fullAddress").get(function (this: ICompany) {
  if (!this.address || this.address.length === 0) return null;
  const addr = this.address[0];
  const { street, city, state, zipCode, country } = addr;
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
});

// Indexes for faster queries
companySchema.index({ ownerId: 1 });
companySchema.index({ name: 1 });
companySchema.index({ taxId: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ createdAt: -1 });

/**
 * Company model
 */
const Company = model<ICompany>("Company", companySchema);

export default Company;
