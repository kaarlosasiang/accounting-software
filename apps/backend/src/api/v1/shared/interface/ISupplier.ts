import { Document, Types } from "mongoose";

import { IAddress } from "./IAddress";

/**
 * Supplier Document Interface
 */
export interface ISupplier {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  supplierCode: string;
  supplierName: string;
  displayName?: string;
  email: string;
  phone: string;
  website?: Date;
  address: IAddress;
  taxId: string;
  paymentTerms: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Supplier Document (Mongoose)
 */
export interface ISupplierDocument extends Omit<ISupplier, "_id">, Document {}
