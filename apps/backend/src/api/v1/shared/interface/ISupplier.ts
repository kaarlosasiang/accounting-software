import mongoose, { Document, Types } from "mongoose";

import { IAddress } from "./IAddress.js";

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
  website?: string;
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
export interface ISupplierDocument extends Omit<ISupplier, "_id">, Document {
  updateBalance(amount: number): Promise<ISupplierDocument>;
}

/**
 * Supplier Model Static Methods
 */
export interface ISupplierModel extends mongoose.Model<ISupplierDocument> {
  findActive(
    companyId: Types.ObjectId
  ): mongoose.Query<
    ISupplierDocument[],
    ISupplierDocument,
    {},
    ISupplierDocument
  >;
  findBySupplierCode(
    companyId: Types.ObjectId,
    supplierCode: string
  ): mongoose.Query<
    ISupplierDocument | null,
    ISupplierDocument,
    {},
    ISupplierDocument
  >;
  searchSuppliers(
    companyId: Types.ObjectId,
    searchTerm: string
  ): mongoose.Query<
    ISupplierDocument[],
    ISupplierDocument,
    {},
    ISupplierDocument
  >;
}
