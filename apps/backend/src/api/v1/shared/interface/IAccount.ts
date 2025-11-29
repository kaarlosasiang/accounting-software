import { Document, Types } from "mongoose";

export interface IAccount extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  accountCode: string;
  accountName: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  subType?: string;
  parentAccount?: Types.ObjectId;
  balance: number;
  normalBalance: "debit" | "credit";
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}
