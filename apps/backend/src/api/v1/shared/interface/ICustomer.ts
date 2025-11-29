import { Document, Types } from "mongoose";

import { IAddress } from "./IAddress";

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
 * Customer Document (Mongoose)
 */
export interface ICustomerDocument extends Omit<ICustomer, "_id">, Document {}
