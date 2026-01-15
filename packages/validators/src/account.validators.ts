import { z } from "zod";

const accountTypeEnum = z.enum(
  ["Asset", "Liability", "Equity", "Revenue", "Expense"],
  {
    message: "Invalid account type",
  }
);

const normalBalanceEnum = z.enum(["Debit", "Credit"], {
  message: "Invalid normal balance",
});

export const accountSchema = z.object({
  accountCode: z
    .string({ message: "Account code is required" })
    .min(1, "Account code is required")
    .regex(/^\d+$/, "Account code must be numeric (e.g., '1000', '2000')"),
  accountName: z
    .string({ message: "Account name is required" })
    .min(1, "Account name is required")
    .max(100, "Account name cannot exceed 100 characters"),
  accountType: accountTypeEnum,
  subType: z
    .string()
    .max(100, "Sub type cannot exceed 100 characters")
    .optional(),
  parentAccount: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "Parent account ID must be a valid ObjectId")
    .optional(),
  balance: z.number({ message: "Balance must be a number" }).default(0),
  normalBalance: normalBalanceEnum,
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export type Account = z.infer<typeof accountSchema>;
