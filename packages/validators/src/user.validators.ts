import { z } from "zod";
import { OrgRole, type ResourcePermission } from "./permissions.js";

// Common validators
export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters");

// User schemas
export const userLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const userRegistrationSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    middleName: z.string().optional(),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    phoneNumber: z
      .string()
      .min(7, "Phone number must be at least 7 characters"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(8, "Confirmation password must be at least 8 characters long"),
    rememberMe: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
});

// Example: ID validation
export const idSchema = z.string().uuid("Invalid ID format");

// ─── Personnel creation schema (used by owner/admin to add a user directly) ──

const resourcePermissionSchema = z.object({
  resource: z.string().min(1),
  actions: z.array(z.string()).default([]),
});

export const createPersonnelSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone_number: z.string().optional(),
  username: z.string().optional(),
  orgRole: z.nativeEnum(OrgRole, {
    message: "Invalid organisation role",
  }),
  grants: z.array(resourcePermissionSchema).default([]),
  revocations: z.array(resourcePermissionSchema).default([]),
});

// Export types inferred from schemas
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type CreatePersonnel = z.infer<typeof createPersonnelSchema>;
// Re-export so callers can use the same ResourcePermission shape from this module
export type { ResourcePermission };
