import { model, Schema } from "mongoose";
import { IRole } from "../shared/interface/IRole.js";

const resourcePermissionSchema = new Schema(
  {
    resource: {
      type: String,
      required: [true, "Resource is required"],
      trim: true,
    },
    actions: {
      type: [String],
      required: [true, "Actions are required"],
      default: [],
    },
  },
  { _id: false },
);

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      maxlength: [50, "Role name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    /**
     * null = system/global role; ObjectId string = company-scoped custom role
     */
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isSystem: {
      type: Boolean,
      required: true,
      default: false,
    },
    permissions: {
      type: [resourcePermissionSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        const { __v, ...rest } = ret;
        return rest;
      },
    },
    toObject: { virtuals: true },
  },
);

// Unique role name per company (null companyId = system scope)
roleSchema.index({ companyId: 1, name: 1 }, { unique: true });
roleSchema.index({ companyId: 1 });
roleSchema.index({ isSystem: 1 });

const Role = model<IRole>("Role", roleSchema);

export default Role;
