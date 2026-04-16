import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { memberPermissionService } from "./member-permission.service.js";
import { getCompanyId, getUserId } from "../../shared/helpers/utils.js";
import PendingInvitePermission from "../../models/PendingInvitePermission.js";
import logger from "../../config/logger.js";

export const memberPermissionController = {
  /**
   * POST /members/provision
   * Called immediately after a user accepts an org invitation.
   * Creates a MemberPermission record using $setOnInsert — safe to call
   * multiple times (no-op if the record already exists).
   * Body: { organizationId, roleName }
   */
  async provisionMember(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const { organizationId, roleName } = req.body as {
        organizationId?: string;
        roleName?: string;
      };

      if (!organizationId || !roleName) {
        res
          .status(400)
          .json({ error: "organizationId and roleName are required" });
        return;
      }

      const record = await memberPermissionService.provisionRole(
        userId,
        organizationId,
        roleName,
      );

      // Apply any pre-configured permissions from an enhanced invite.
      // Look up by the authenticated user's email + the organisation they joined.
      try {
        const userEmail = (req.authUser as any)?.email as string | undefined;
        if (userEmail) {
          const pending = await PendingInvitePermission.findOneAndDelete({
            email: userEmail.toLowerCase().trim(),
            organizationId,
          });

          if (pending) {
            await memberPermissionService.assignRole(userId, organizationId, {
              roleId: pending.roleId.toString(),
              grants: pending.grants as {
                resource: string;
                actions: string[];
              }[],
              revocations: pending.revocations as {
                resource: string;
                actions: string[];
              }[],
            });

            logger.info("Applied pending invite permissions on provision", {
              userId,
              organizationId,
              roleId: pending.roleId.toString(),
            });
          }
        }
      } catch (pendingErr) {
        // Non-fatal: log but don't fail the provision request
        logger.warn("Failed to apply pending invite permissions", {
          error:
            pendingErr instanceof Error
              ? pendingErr.message
              : String(pendingErr),
          userId,
          organizationId,
        });
      }

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /members/:userId/permissions
   * Returns the raw permission record (role + grants + revocations).
   */
  async getMemberPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = getCompanyId(req);
      if (!organizationId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }

      const record = await memberPermissionService.getMemberPermissions(
        req.params.userId,
        organizationId,
      );

      if (!record) {
        res.status(404).json({ error: "No permission record for this member" });
        return;
      }

      res.json(record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /members/:userId/permissions
   * Assign a role and/or set per-user grants + revocations.
   * Body: { roleId, grants?, revocations? }
   */
  async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = getCompanyId(req);
      if (!organizationId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }

      const record = await memberPermissionService.assignRole(
        req.params.userId,
        organizationId,
        req.body,
      );

      res.json(record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /members/:userId/permissions/overrides
   * Update only grants and/or revocations without changing the role.
   * Body: { grants?, revocations? }
   */
  async updateOverrides(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = getCompanyId(req);
      if (!organizationId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }

      const record = await memberPermissionService.updateOverrides(
        req.params.userId,
        organizationId,
        req.body,
      );

      res.json(record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /members/:userId/permissions/effective
   * Returns the fully resolved effective permission set (role + grants − revocations).
   */
  async getEffectivePermissions(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const organizationId = getCompanyId(req);
      if (!organizationId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }

      const effective = await memberPermissionService.getEffectivePermissions(
        req.params.userId,
        organizationId,
      );

      res.json(effective);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /members/pending-permissions
   * Stores pre-configured role + permission overrides for a pending invitation.
   * When the invited user accepts and calls /provision, these are automatically
   * applied instead of the default provisioned role.
   *
   * Body: { email, organizationId, roleId, grants?, revocations? }
   * Requires: Resource.user + Action.create
   */
  async storePendingPermissions(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const sessionOrgId = getCompanyId(req);
      if (!sessionOrgId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }

      const {
        email,
        roleId,
        grants = [],
        revocations = [],
      } = req.body as {
        email?: string;
        roleId?: string;
        grants?: { resource: string; actions: string[] }[];
        revocations?: { resource: string; actions: string[] }[];
      };

      if (!email || !roleId) {
        res.status(400).json({ error: "email and roleId are required" });
        return;
      }

      const record = await PendingInvitePermission.findOneAndUpdate(
        {
          email: email.toLowerCase().trim(),
          organizationId: sessionOrgId,
        },
        {
          $set: {
            email: email.toLowerCase().trim(),
            organizationId: sessionOrgId,
            roleId: new Types.ObjectId(roleId),
            grants,
            revocations,
          },
        },
        { upsert: true, new: true },
      );

      logger.info("Stored pending invite permissions", {
        email,
        organizationId: sessionOrgId,
        roleId,
      });

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  },
};
