import mongoose from "mongoose";
import { Supplier } from "../models/Supplier.js";
import logger from "../config/logger.js";
import dotenv from "dotenv";

dotenv.config();

interface SeedSupplier {
  supplierCode: string;
  supplierName: string;
  displayName?: string;
  email: string;
  phone: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId: string;
  paymentTerms: string;
  openingBalance: number;
  isActive: boolean;
  notes?: string;
}

/**
 * Default test suppliers for development/testing
 */
const defaultSuppliers: SeedSupplier[] = [
  {
    supplierCode: "MRT-2025",
    supplierName: "Manila Rice Trading Co.",
    displayName: "Manila Rice Trading",
    email: "accounts@manilarice.com",
    phone: "+63 2 1234 5678",
    website: "https://www.manilarice.com",
    address: {
      street: "123 Rizal Avenue",
      city: "Manila",
      state: "Metro Manila",
      zipCode: "1000",
      country: "Philippines",
    },
    taxId: "123-456-789-000",
    paymentTerms: "Net 30",
    openingBalance: 0,
    isActive: true,
    notes: "Primary rice supplier for food items",
  },
  {
    supplierCode: "MCS-2025",
    supplierName: "Metro Cleaning Supplies Inc.",
    displayName: "Metro Cleaning Supplies",
    email: "billing@metrocleaning.ph",
    phone: "+63 2 9876 5432",
    website: "https://www.metrocleaning.ph",
    address: {
      street: "456 Quezon Boulevard",
      city: "Quezon City",
      state: "Metro Manila",
      zipCode: "1100",
      country: "Philippines",
    },
    taxId: "234-567-890-000",
    paymentTerms: "Net 30",
    openingBalance: 3500.0,
    isActive: true,
    notes: "Cleaning supplies and non-food items",
  },
  {
    supplierCode: "BPW-2025",
    supplierName: "Beauty Products Wholesalers Corp.",
    displayName: "Beauty Products Wholesalers",
    email: "sales@beautyproducts.ph",
    phone: "+63 2 5555 1234",
    website: "https://www.beautyproducts.ph",
    address: {
      street: "789 Makati Avenue",
      city: "Makati",
      state: "Metro Manila",
      zipCode: "1200",
      country: "Philippines",
    },
    taxId: "345-678-901-000",
    paymentTerms: "Net 15",
    openingBalance: 5250.0,
    isActive: true,
    notes: "Beauty and personal care products",
  },
  {
    supplierCode: "QCG-2025",
    supplierName: "Quick Canned Goods Distributor",
    displayName: "Quick Canned Goods",
    email: "accounts@quickcanned.com",
    phone: "+63 2 7777 8888",
    website: "https://www.quickcanned.com",
    address: {
      street: "321 Commonwealth Avenue",
      city: "Quezon City",
      state: "Metro Manila",
      zipCode: "1101",
      country: "Philippines",
    },
    taxId: "456-789-012-000",
    paymentTerms: "Net 30",
    openingBalance: 3250.0,
    isActive: true,
    notes: "Canned goods and preserved foods",
  },
  {
    supplierCode: "ODM-2025",
    supplierName: "Office Depot Manila",
    displayName: "Office Depot",
    email: "billing@officedepot.ph",
    phone: "+63 2 3333 4444",
    website: "https://www.officedepot.ph",
    address: {
      street: "654 Ortigas Avenue",
      city: "Pasig",
      state: "Metro Manila",
      zipCode: "1600",
      country: "Philippines",
    },
    taxId: "567-890-123-000",
    paymentTerms: "Net 30",
    openingBalance: 0,
    isActive: false,
    notes: "Office supplies and equipment (inactive)",
  },
  {
    supplierCode: "FVG-2025",
    supplierName: "Fresh Vegetables Growers Association",
    displayName: "Fresh Vegetables Growers",
    email: "sales@freshveggies.ph",
    phone: "+63 2 2222 3333",
    address: {
      street: "890 EDSA",
      city: "Mandaluyong",
      state: "Metro Manila",
      zipCode: "1550",
      country: "Philippines",
    },
    taxId: "678-901-234-000",
    paymentTerms: "Net 15",
    openingBalance: 0,
    isActive: true,
    notes: "Fresh vegetables and produce supplier",
  },
  {
    supplierCode: "BVG-2025",
    supplierName: "Beverage Vendors Group",
    displayName: "Beverage Vendors",
    email: "orders@beveragevendors.ph",
    phone: "+63 2 4444 5555",
    website: "https://www.beveragevendors.ph",
    address: {
      street: "111 Ayala Avenue",
      city: "Makati",
      state: "Metro Manila",
      zipCode: "1200",
      country: "Philippines",
    },
    taxId: "789-012-345-000",
    paymentTerms: "Net 30",
    openingBalance: 1500.0,
    isActive: true,
    notes: "Beverages and drinks supplier",
  },
];

/**
 * Seed suppliers for a specific company
 */
export async function seedSuppliersForCompany(
  companyId: string,
): Promise<void> {
  try {
    // Check if suppliers already exist for this company
    const existingCount = await Supplier.countDocuments({ companyId });

    if (existingCount > 0) {
      logger.info(
        `Suppliers already exist for company ${companyId}. Skipping seed.`,
      );
      return;
    }

    // Create suppliers with the company ID
    const suppliersWithCompanyId = defaultSuppliers.map(
      (supplier) =>
        ({
          ...supplier,
          companyId: new mongoose.Types.ObjectId(companyId),
          currentBalance: supplier.openingBalance || 0,
        }) as any,
    );

    await Supplier.insertMany(suppliersWithCompanyId);

    logger.info(
      `Successfully seeded ${defaultSuppliers.length} suppliers for company ${companyId}`,
    );
  } catch (error) {
    logger.logError(error as Error, {
      operation: "seed-suppliers-for-company",
      companyId,
    });
    throw error;
  }
}

/**
 * Standalone script to seed suppliers
 * Usage: npx tsx src/api/v1/scripts/seedSuppliers.ts <companyId>
 */
async function main() {
  const companyId = process.argv[2];

  if (!companyId) {
    logger.error(
      "Usage: npx tsx src/api/v1/scripts/seedSuppliers.ts <companyId>",
    );
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info("Connected to MongoDB");

    await seedSuppliersForCompany(companyId);

    logger.info("Seeding complete!");
  } catch (error) {
    logger.logError(error as Error, { operation: "seed-suppliers-main" });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default defaultSuppliers;
