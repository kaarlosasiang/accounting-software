import { describe, it, expect, vi, beforeEach } from "vitest";
import { Action, OrgRole, Resource } from "../../auth/permissions.js";
import {
  hasPermission,
  resolvePermissions,
} from "../../auth/permission-resolver.js";

// Mock the Mongoose models before importing the resolver
vi.mock("../../../models/MemberPermission.js", () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock("../../../models/Role.js", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

// Import after mock setup
import MemberPermission from "../../../models/MemberPermission.js";
import Role from "../../../models/Role.js";

const mockedMemberPermission = vi.mocked(MemberPermission) as any;
const mockedRole = vi.mocked(Role) as any;

const USER_ID = "user-abc-123";
const ORG_ID = "org-xyz-456";

function makeRolePermissions(
  permissions: { resource: Resource; actions: Action[] }[],
) {
  return {
    permissions,
  };
}

function makeMemberPermDoc(opts: {
  rolePermissions: { resource: Resource; actions: Action[] }[];
  grants?: { resource: Resource; actions: Action[] }[];
  revocations?: { resource: Resource; actions: Action[] }[];
}) {
  return {
    roleId: makeRolePermissions(opts.rolePermissions),
    grants: opts.grants ?? [],
    revocations: opts.revocations ?? [],
    populate: vi.fn().mockReturnThis(),
  };
}

// Helper: create a chainable mock for .populate()
function withPopulate(doc: any) {
  return {
    populate: vi.fn().mockResolvedValue(doc),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Safe defaults — tests override as needed
  mockedRole.findOne = vi.fn().mockResolvedValue(null);
  mockedMemberPermission.findOneAndUpdate = vi.fn();
});

describe("hasPermission", () => {
  it("returns true when the action is in the set", () => {
    const effective = {
      [Resource.invoice]: new Set([Action.read, Action.create]),
    };
    expect(hasPermission(effective, Resource.invoice, Action.read)).toBe(true);
    expect(hasPermission(effective, Resource.invoice, Action.create)).toBe(
      true,
    );
  });

  it("returns false when the action is not in the set", () => {
    const effective = {
      [Resource.invoice]: new Set([Action.read]),
    };
    expect(hasPermission(effective, Resource.invoice, Action.delete)).toBe(
      false,
    );
  });

  it("returns false for a resource with no entry", () => {
    const effective = {};
    expect(hasPermission(effective, Resource.invoice, Action.read)).toBe(false);
  });
});

describe("resolvePermissions", () => {
  it("returns empty object when no MemberPermission record AND no system role exists", async () => {
    // No existing member permission record
    mockedMemberPermission.findOne = vi
      .fn()
      .mockReturnValue(withPopulate(null));
    // System role also not found (seed hasn't run)
    mockedRole.findOne = vi.fn().mockResolvedValue(null);
    // findOneAndUpdate should not be called in this path, but set it up anyway
    mockedMemberPermission.findOneAndUpdate = vi.fn();

    const result = await resolvePermissions(USER_ID, ORG_ID);
    expect(result).toEqual({});
  });

  it("auto-assigns fallback role and returns its permissions when no record exists", async () => {
    const ownerRoleDoc = {
      _id: "role-owner-id",
      permissions: [
        {
          resource: Resource.invoice,
          actions: [Action.read, Action.create, Action.update, Action.delete],
        },
        {
          resource: Resource.user,
          actions: [Action.read, Action.create, Action.update, Action.delete],
        },
      ],
    };

    // No existing member permission record
    mockedMemberPermission.findOne = vi
      .fn()
      .mockReturnValueOnce(withPopulate(null));

    // System role found
    mockedRole.findOne = vi.fn().mockResolvedValue(ownerRoleDoc);

    // findOneAndUpdate returns a new doc with the role populated
    const newDoc = {
      roleId: ownerRoleDoc,
      grants: [],
      revocations: [],
    };
    mockedMemberPermission.findOneAndUpdate = vi
      .fn()
      .mockReturnValue(withPopulate(newDoc));

    const result = await resolvePermissions(USER_ID, ORG_ID, OrgRole.owner);

    expect(hasPermission(result, Resource.invoice, Action.read)).toBe(true);
    expect(hasPermission(result, Resource.user, Action.read)).toBe(true);
    expect(mockedMemberPermission.findOneAndUpdate).toHaveBeenCalledOnce();
  });

  it("returns the role base permissions", async () => {
    const doc = makeMemberPermDoc({
      rolePermissions: [
        { resource: Resource.invoice, actions: [Action.read, Action.create] },
        { resource: Resource.customer, actions: [Action.read] },
      ],
    });
    mockedMemberPermission.findOne = vi.fn().mockReturnValue(withPopulate(doc));

    const result = await resolvePermissions(USER_ID, ORG_ID);

    expect(hasPermission(result, Resource.invoice, Action.read)).toBe(true);
    expect(hasPermission(result, Resource.invoice, Action.create)).toBe(true);
    expect(hasPermission(result, Resource.invoice, Action.delete)).toBe(false);
    expect(hasPermission(result, Resource.customer, Action.read)).toBe(true);
    expect(hasPermission(result, Resource.customer, Action.create)).toBe(false);
  });

  it("applies grants on top of the base role", async () => {
    const doc = makeMemberPermDoc({
      rolePermissions: [
        // staff: no journal entry access
        { resource: Resource.journalEntry, actions: [] },
      ],
      grants: [
        // grant: allow creating journal entries
        { resource: Resource.journalEntry, actions: [Action.create] },
      ],
    });
    mockedMemberPermission.findOne = vi.fn().mockReturnValue(withPopulate(doc));

    const result = await resolvePermissions(USER_ID, ORG_ID);

    expect(hasPermission(result, Resource.journalEntry, Action.create)).toBe(
      true,
    );
    // other actions still denied
    expect(hasPermission(result, Resource.journalEntry, Action.delete)).toBe(
      false,
    );
  });

  it("applies revocations removing actions from the base role", async () => {
    const doc = makeMemberPermDoc({
      rolePermissions: [
        {
          resource: Resource.invoice,
          actions: [Action.read, Action.create, Action.update, Action.delete],
        },
      ],
      revocations: [{ resource: Resource.invoice, actions: [Action.delete] }],
    });
    mockedMemberPermission.findOne = vi.fn().mockReturnValue(withPopulate(doc));

    const result = await resolvePermissions(USER_ID, ORG_ID);

    expect(hasPermission(result, Resource.invoice, Action.read)).toBe(true);
    expect(hasPermission(result, Resource.invoice, Action.create)).toBe(true);
    expect(hasPermission(result, Resource.invoice, Action.update)).toBe(true);
    expect(hasPermission(result, Resource.invoice, Action.delete)).toBe(false);
  });

  it("applies both grants and revocations together", async () => {
    const doc = makeMemberPermDoc({
      rolePermissions: [
        {
          resource: Resource.invoice,
          actions: [Action.read, Action.create, Action.delete],
        },
        { resource: Resource.journalEntry, actions: [] },
      ],
      grants: [{ resource: Resource.journalEntry, actions: [Action.read] }],
      revocations: [{ resource: Resource.invoice, actions: [Action.delete] }],
    });
    mockedMemberPermission.findOne = vi.fn().mockReturnValue(withPopulate(doc));

    const result = await resolvePermissions(USER_ID, ORG_ID);

    expect(hasPermission(result, Resource.invoice, Action.read)).toBe(true);
    expect(hasPermission(result, Resource.invoice, Action.create)).toBe(true);
    expect(hasPermission(result, Resource.invoice, Action.delete)).toBe(false); // revoked
    expect(hasPermission(result, Resource.journalEntry, Action.read)).toBe(
      true,
    ); // granted
    expect(hasPermission(result, Resource.journalEntry, Action.create)).toBe(
      false,
    );
  });

  it("a grant for a resource not in the base role adds it", async () => {
    const doc = makeMemberPermDoc({
      rolePermissions: [],
      grants: [{ resource: Resource.report, actions: [Action.read] }],
    });
    mockedMemberPermission.findOne = vi.fn().mockReturnValue(withPopulate(doc));

    const result = await resolvePermissions(USER_ID, ORG_ID);

    expect(hasPermission(result, Resource.report, Action.read)).toBe(true);
  });

  it("revoking from a missing resource is a no-op (no crash)", async () => {
    const doc = makeMemberPermDoc({
      rolePermissions: [],
      revocations: [{ resource: Resource.invoice, actions: [Action.delete] }],
    });
    mockedMemberPermission.findOne = vi.fn().mockReturnValue(withPopulate(doc));

    await expect(resolvePermissions(USER_ID, ORG_ID)).resolves.not.toThrow();
    const result = await resolvePermissions(USER_ID, ORG_ID);
    expect(hasPermission(result, Resource.invoice, Action.delete)).toBe(false);
  });
});
