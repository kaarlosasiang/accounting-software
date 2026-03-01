import { describe, it, expect } from "vitest";
import {
  Action,
  DEFAULT_ROLE_PERMISSIONS,
  OrgRole,
  Resource,
} from "../../auth/permissions.js";

const ALL_ROLES = Object.values(OrgRole);
const ALL_RESOURCES = Object.values(Resource);
const ALL_ACTIONS = Object.values(Action);

describe("DEFAULT_ROLE_PERMISSIONS", () => {
  it("defines a permissions map for every OrgRole", () => {
    for (const role of ALL_ROLES) {
      expect(DEFAULT_ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it("covers every Resource for every role", () => {
    for (const role of ALL_ROLES) {
      for (const resource of ALL_RESOURCES) {
        expect(DEFAULT_ROLE_PERMISSIONS[role][resource]).toBeDefined();
      }
    }
  });

  it("actions arrays contain only valid Action values", () => {
    for (const role of ALL_ROLES) {
      for (const resource of ALL_RESOURCES) {
        const actions = DEFAULT_ROLE_PERMISSIONS[role][resource];
        for (const action of actions) {
          expect(ALL_ACTIONS).toContain(action);
        }
      }
    }
  });

  describe("owner", () => {
    it("has full CRUD on every resource", () => {
      for (const resource of ALL_RESOURCES) {
        expect(DEFAULT_ROLE_PERMISSIONS[OrgRole.owner][resource]).toEqual(
          expect.arrayContaining(ALL_ACTIONS),
        );
      }
    });
  });

  describe("admin", () => {
    it("has full CRUD on every resource", () => {
      for (const resource of ALL_RESOURCES) {
        expect(DEFAULT_ROLE_PERMISSIONS[OrgRole.admin][resource]).toEqual(
          expect.arrayContaining(ALL_ACTIONS),
        );
      }
    });
  });

  describe("accountant", () => {
    it("has full CRUD on financial resources", () => {
      const financialResources = [
        Resource.accounts,
        Resource.journalEntry,
        Resource.invoice,
        Resource.bill,
        Resource.payment,
        Resource.customer,
        Resource.supplier,
        Resource.inventory,
        Resource.period,
      ];
      for (const resource of financialResources) {
        expect(DEFAULT_ROLE_PERMISSIONS[OrgRole.accountant][resource]).toEqual(
          expect.arrayContaining(ALL_ACTIONS),
        );
      }
    });

    it("has read-only on reports and ledger", () => {
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.accountant][Resource.report],
      ).toEqual([Action.read]);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.accountant][Resource.ledger],
      ).toEqual([Action.read]);
    });

    it("has no access to company settings, users, or roles", () => {
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.accountant][Resource.companySetting],
      ).toHaveLength(0);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.accountant][Resource.user],
      ).toHaveLength(0);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.accountant][Resource.role],
      ).toHaveLength(0);
    });
  });

  describe("staff", () => {
    it("has no access to journal entries", () => {
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][Resource.journalEntry],
      ).toHaveLength(0);
    });

    it("cannot delete invoices or bills", () => {
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][Resource.invoice],
      ).not.toContain(Action.delete);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][Resource.bill],
      ).not.toContain(Action.delete);
    });

    it("has full CRUD on payments, customers, suppliers, inventory", () => {
      const fullResources = [
        Resource.payment,
        Resource.customer,
        Resource.supplier,
        Resource.inventory,
      ];
      for (const resource of fullResources) {
        expect(DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][resource]).toEqual(
          expect.arrayContaining(ALL_ACTIONS),
        );
      }
    });

    it("has no access to company settings, users, roles, or periods", () => {
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][Resource.companySetting],
      ).toHaveLength(0);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][Resource.user],
      ).toHaveLength(0);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][Resource.role],
      ).toHaveLength(0);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][Resource.period],
      ).toHaveLength(0);
    });

    it("has read-only on accounts", () => {
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.staff][Resource.accounts],
      ).toEqual([Action.read]);
    });
  });

  describe("viewer", () => {
    it("has read-only on all readable resources", () => {
      const readableResources = [
        Resource.accounts,
        Resource.journalEntry,
        Resource.invoice,
        Resource.bill,
        Resource.payment,
        Resource.customer,
        Resource.supplier,
        Resource.inventory,
        Resource.report,
        Resource.ledger,
        Resource.period,
      ];
      for (const resource of readableResources) {
        expect(DEFAULT_ROLE_PERMISSIONS[OrgRole.viewer][resource]).toEqual([
          Action.read,
        ]);
      }
    });

    it("has no access to company settings, users, or roles", () => {
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.viewer][Resource.companySetting],
      ).toHaveLength(0);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.viewer][Resource.user],
      ).toHaveLength(0);
      expect(
        DEFAULT_ROLE_PERMISSIONS[OrgRole.viewer][Resource.role],
      ).toHaveLength(0);
    });
  });
});
