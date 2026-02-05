import { Document, Types, Model } from "mongoose";

import { IAddress } from "./IAddress.js";

/**
 * Customer Document Interface
 */
export interface ICustomer {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  customerCode: string;
  customerName: string;
  displayName: string;
  email: string;
  phone: string;
  website?: string;
  billingAddress: IAddress;
  shippingAddress?: IAddress;
  taxId: string;
  paymentTerms: string;
  creditLimit: number;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer Instance Methods
 */
export interface ICustomerMethods {
  updateBalance(amount: number): Promise<ICustomerDocument>;
  hasCreditAvailable(amount: number): boolean;
}

/**
 * Customer Static Methods
 */
export interface ICustomerModel
  extends Model<ICustomerDocument, {}, ICustomerMethods> {
  findActive(companyId: Types.ObjectId): Promise<ICustomerDocument[]>;
  findByCustomerCode(
    companyId: Types.ObjectId,
    customerCode: string
  ): Promise<ICustomerDocument | null>;
  searchCustomers(
    companyId: Types.ObjectId,
    searchTerm: string
  ): Promise<ICustomerDocument[]>;
}

/**
 * Customer Document (Mongoose)
 */
export interface ICustomerDocument
  extends Omit<ICustomer, "_id">,
    Document,
    ICustomerMethods {
  fullBillingAddress: string;
  fullShippingAddress: string;
  availableCredit: number;
}
