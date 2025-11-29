/**
 * Shared Address Interface
 * Used across Customer, Supplier, Company, and other models
 */
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
