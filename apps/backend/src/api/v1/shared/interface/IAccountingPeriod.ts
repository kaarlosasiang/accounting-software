import { Document, Types } from "mongoose";

export enum PeriodStatus {
  OPEN = "Open",
  CLOSED = "Closed",
  LOCKED = "Locked",
}

export enum PeriodType {
  MONTHLY = "Monthly",
  QUARTERLY = "Quarterly",
  ANNUAL = "Annual",
}

export interface IAccountingPeriod extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  periodName: string; // e.g., "January 2026", "Q1 2026", "FY 2026"
  periodType: PeriodType;
  fiscalYear: number; // e.g., 2026
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  closedBy?: Types.ObjectId; // Reference to User who closed the period
  closedAt?: Date;
  closingJournalEntryId?: Types.ObjectId; // Reference to the closing JE
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IAccountingPeriodDocument extends IAccountingPeriod {}
