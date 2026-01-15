import { Document, Types } from "mongoose";

export interface IAccount extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  accountCode: string;
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  subType?: string;
  parentAccount?: Types.ObjectId;
  balance: number;
  normalBalance: "Debit" | "Credit";
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}
