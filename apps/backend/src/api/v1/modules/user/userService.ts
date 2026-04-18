import { hashPassword } from "better-auth/crypto";
import mongoose from "mongoose";

import type { CreatePersonnel } from "@sas/validators";

import logger from "../../config/logger.js";
import User from "../../models/User.js";
import { authServer } from "../auth/betterAuth.js";
import { memberPermissionService } from "../roles/member-permission.service.js";

const userService = {
  updateUserRole: async (userId: string, role: string, companyId: string) => {
    try {
      const result = await User.updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            role,
            companyId,
            companySetupCompletedAt: new Date(),
          },
        },
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Directly creates a new user and adds them to the active organisation.
   * Avoids the Better-Auth admin-plugin guard (which requires a global admin
   * session) by writing directly through Mongoose + using the organisation
   * plugin's server-only addMember API.
   *
   * Security: `organizationId` must come from the caller's session
   *           (getCompanyId(req)), never from the request body.
   */
  createPersonnel: async (payload: CreatePersonnel, organizationId: string) => {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      password,
      phone_number,
      username,
      orgRole,
      grants = [],
      revocations = [],
    } = payload;

    // 1. Hash password using the same algorithm Better-Auth uses (scrypt-based)
    const hashedPassword = await hashPassword(password);

    // 2. Write user record directly into the `users` collection (Better-Auth
    //    remaps the "user" table to "users" via the Proxy in betterAuth.ts).
    //    We must not use the legacy User mongoose model — that's a different
    //    pre-Better-Auth schema. Instead use the native MongoDB client.
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not established");

    const usersCol = db.collection("users");

    // Guard against duplicate email
    const existing = await usersCol.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      throw new Error(`A user with email "${email}" already exists.`);
    }

    // Better-Auth MongoDB adapter uses a random string ID stored in `id`
    // and MongoDB's auto `_id`.  We generate a compatible ID.
    const { generateRandomString } = await import("better-auth/crypto");
    const newId = generateRandomString(32);

    const now = new Date();
    const userDoc = {
      id: newId,
      name: `${first_name}${last_name ? " " + last_name : ""}`,
      email: email.toLowerCase().trim(),
      emailVerified: true, // Admin-created accounts are pre-verified
      image: null,
      createdAt: now,
      updatedAt: now,
      // Admin plugin fields
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      // Better-Auth stores hashed passwords in a separate "accounts" collection
      // (emailAndPassword provider).  See step 3.
      // Additional profile fields matching betterAuth additionalFields config
      first_name: first_name.trim(),
      middle_name: middle_name?.trim() ?? null,
      last_name: last_name.trim(),
      phone_number: phone_number?.trim() ?? null,
      username: username?.trim() ?? null,
      hasActiveSubscription: false,
      subscriptionPlan: null,
      subscriptionStatus: null,
      profileSetupCompletedAt: null,
      teamInviteCompletedAt: null,
      onboardingCompletedAt: null,
    };

    await usersCol.insertOne(userDoc);

    // 3. Create the credential record (emailAndPassword provider account).
    //    Better-Auth stores passwords in the `accounts` collection.
    const accountsCol = db.collection("accounts");
    const accountId = generateRandomString(32);
    await accountsCol.insertOne({
      id: accountId,
      userId: newId,
      accountId: email.toLowerCase().trim(),
      providerId: "credential",
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Add the new user to the organisation using the org plugin's
    //    server-only addMember API (no session headers required).
    //    Better-Auth's org plugin only recognises "owner" | "admin" | "member".
    //    Our fine-grained roles (accountant, staff, viewer) are stored in the
    //    custom memberPermissions collection (step 5) — so we map to the
    //    closest built-in role here.
    const betterAuthOrgRole: "owner" | "admin" | "member" =
      orgRole === "owner" ? "owner" : orgRole === "admin" ? "admin" : "member";

    await authServer.api.addMember({
      body: {
        userId: newId,
        organizationId,
        role: betterAuthOrgRole,
      },
    });

    logger.info("Personnel created and added to organisation", {
      userId: newId,
      organizationId,
      orgRole,
      email,
    });

    // 5. Create the custom RBAC record (role + optional grants/revocations).
    await memberPermissionService.provisionRoleWithOverrides(
      newId,
      organizationId,
      orgRole,
      grants as { resource: string; actions: string[] }[],
      revocations as { resource: string; actions: string[] }[],
    );

    return {
      id: newId,
      name: userDoc.name,
      email: userDoc.email,
      first_name,
      last_name,
      orgRole,
    };
  },
};

export default userService;
