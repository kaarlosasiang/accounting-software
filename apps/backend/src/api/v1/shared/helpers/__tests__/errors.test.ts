import { describe, expect, it } from "vitest";

import {
  clientErrorMessage,
  clientErrorStatus,
  GENERIC_ERROR_MESSAGE,
} from "../errors.js";

const named = (name: string, message: string, extra: object = {}) =>
  Object.assign(new Error(message), { name }, extra);

describe("clientErrorMessage / clientErrorStatus", () => {
  it("passes business-rule messages through as 400", () => {
    const error = new Error("Allocation exceeds the balance due");
    expect(clientErrorMessage(error)).toBe(
      "Allocation exceeds the balance due",
    );
    expect(clientErrorStatus(error)).toBe(400);
  });

  it("masks driver and programming errors as 500", () => {
    const driver = named(
      "MongoServerError",
      "E2 failed on collection rrd10-sas.ledgers: bad $group",
    );
    const bug = new TypeError("Cannot read properties of undefined");
    for (const error of [driver, bug]) {
      expect(clientErrorMessage(error)).toBe(GENERIC_ERROR_MESSAGE);
      expect(clientErrorStatus(error)).toBe(500);
    }
    expect(clientErrorMessage(bug, "Failed to load")).toBe("Failed to load");
  });

  it("maps 'not found' business errors to 404", () => {
    expect(clientErrorStatus(new Error("Role not found"))).toBe(404);
  });

  it("maps duplicate-key errors to a friendly 409", () => {
    const dup = named(
      "MongoServerError",
      "E11000 duplicate key error collection: rrd10-sas.accounts index: companyId_1_accountCode_1",
      { code: 11000 },
    );
    expect(clientErrorMessage(dup)).toBe(
      "A record with these details already exists.",
    );
    expect(clientErrorStatus(dup)).toBe(409);
  });

  it("respects an explicit status (auth errors)", () => {
    const authz = named("AuthorizationError", "Admin access required", {
      status: 403,
    });
    expect(clientErrorMessage(authz)).toBe("Admin access required");
    expect(clientErrorStatus(authz)).toBe(403);
  });

  it("handles non-Error values", () => {
    expect(clientErrorMessage("boom")).toBe(GENERIC_ERROR_MESSAGE);
    expect(clientErrorStatus(undefined)).toBe(500);
  });
});
