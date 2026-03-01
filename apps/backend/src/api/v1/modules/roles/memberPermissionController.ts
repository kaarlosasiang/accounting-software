import { Request, Response, NextFunction } from "express";
import { memberPermissionService } from "./member-permission.service.js";
import { getCompanyId, getUserId } from "../../shared/helpers/utils.js";

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
};
