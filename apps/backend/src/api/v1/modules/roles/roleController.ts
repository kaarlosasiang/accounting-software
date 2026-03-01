import { Request, Response, NextFunction } from "express";
import { roleService } from "./role.service.js";
import { getCompanyId } from "../../shared/helpers/utils.js";

export const roleController = {
  async listRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }
      const roles = await roleService.listRoles(companyId);
      res.json(roles);
    } catch (error) {
      next(error);
    }
  },

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }
      const role = await roleService.getRoleById(req.params.id, companyId);
      res.json(role);
    } catch (error) {
      next(error);
    }
  },

  getDefaults(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(roleService.getDefaults());
    } catch (error) {
      next(error);
    }
  },

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }
      const role = await roleService.createRole(companyId, req.body);
      res.status(201).json(role);
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }
      const role = await roleService.updateRole(
        req.params.id,
        companyId,
        req.body,
      );
      res.json(role);
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        res.status(400).json({ error: "Active company not found in session" });
        return;
      }
      await roleService.deleteRole(req.params.id, companyId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
