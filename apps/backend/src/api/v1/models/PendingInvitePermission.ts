import { model, Schema } from "mongoose";

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

/**
 * Stores pre-configured permissions for a pending org invitation.
 * Created when an owner/admin sends an invite with a specific role and
 * optional permission overrides. On invitation acceptance (provisionMember),
 * this record is read, applied to the MemberPermission, then deleted.
 *
 * TTL: 7 days — matches Better-Auth's invitationExpiresIn setting.
 * Unique on (email, organizationId) — one pending config per address per org.
 */
const pendingInvitePermissionSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    organizationId: {
      type: String,
      required: [true, "Organisation ID is required"],
      trim: true,
    },
    /** The system/custom role _id to assign on acceptance */
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role ID is required"],
    },
    grants: {
      type: [resourcePermissionSchema],
      default: [],
    },
    revocations: {
      type: [resourcePermissionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Unique: one pending config per (email, org)
pendingInvitePermissionSchema.index(
  { email: 1, organizationId: 1 },
  { unique: true },
);

// TTL index: auto-delete after 7 days (604 800 seconds)
pendingInvitePermissionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 604_800 },
);

const PendingInvitePermission = model(
  "PendingInvitePermission",
  pendingInvitePermissionSchema,
);

export default PendingInvitePermission;
