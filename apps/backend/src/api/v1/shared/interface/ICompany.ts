import { Document, Types } from "mongoose";

import { IAddress } from "./IAddress";

export interface ICompany extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  businessType:
    | "sole proprietorship"
    | "partnership"
    | "corporation"
    | "non-profit"
    | "government"
    | "other";
  taxId: string;
  address?: IAddress[];
  contact: Array<{
    phone: string;
    email: string;
    website: string;
  }>;
  fiscalYearStart: Date;
  currency: string;
  logo: string;
  headerText: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
