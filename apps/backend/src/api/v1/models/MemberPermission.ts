import { model, Schema } from "mongoose";
import { IMemberPermission } from "../shared/interface/IMemberPermission.js";

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

const memberPermissionSchema = new Schema<IMemberPermission>(
  {
    /** BetterAuth user ID (string) */
    userId: {
      type: String,
      required: [true, "User ID is required"],
      trim: true,
    },
    /** BetterAuth organization/company ID (string) */
    organizationId: {
      type: String,
      required: [true, "Organization ID is required"],
      trim: true,
    },
    /** The role assigned to this member in this company */
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role ID is required"],
    },
    /**
     * Per-user permission additions on top of the role.
     * e.g. give a staff member the ability to create journal entries.
     */
    grants: {
      type: [resourcePermissionSchema],
      default: [],
    },
    /**
     * Per-user permission removals from the role.
     * e.g. prevent an accountant from deleting invoices.
     */
    revocations: {
      type: [resourcePermissionSchema],
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

// One permission record per user per company
memberPermissionSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true },
);
memberPermissionSchema.index({ organizationId: 1 });
memberPermissionSchema.index({ roleId: 1 });

const MemberPermission = model<IMemberPermission>(
  "MemberPermission",
  memberPermissionSchema,
);

export default MemberPermission;
