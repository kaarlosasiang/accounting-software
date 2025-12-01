import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  role: "Owner" | "Admin" | "Accountant" | "User";
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  password: string;
  phone_number: number;
  token: string;
  token_expiry: Date;
  username: string;
  createdAt: Date;
  updatedAt?: Date;
  last_login_date?: Date;
  last_activity: Date;
}
