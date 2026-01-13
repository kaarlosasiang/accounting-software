import { MongoClient, ObjectId } from "mongodb";
import { constants } from "../../config/index.js";
import logger from "../../config/logger.js";
import { seedAccountsForCompany } from "../../scripts/seedAccounts.js";

const mongoClient = new MongoClient(constants.mongodbUri);
const db = mongoClient.db(constants.dbName);
const companiesCollection = db.collection("companies");
const usersCollection = db.collection("user");

/**
 * Company Service
 * Handles all company-related business logic
 */
const companyService = {
  /**
   * Create a new company
   */
  createCompany: async (companyData: {
    userId: string;
    companyName: string;
    companyId: string;
    industry?: string;
    companySize?: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    taxId?: string;
    registrationNumber?: string;
    website?: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      const {
        userId,
        companyName,
        companyId,
        industry,
        companySize,
        description,
        address,
        city,
        state,
        country,
        postalCode,
        taxId,
        registrationNumber,
        website,
        phone,
        email,
      } = companyData;

      // Check if company ID already exists
      const existingCompany = await companiesCollection.findOne({ companyId });
      if (existingCompany) {
        throw new Error("Company ID already exists");
      }

      // Create company document
      const newCompany = {
        companyId,
        name: companyName,
        industry,
        companySize,
        description,
        address: {
          street: address,
          city,
          state,
          country,
          postalCode,
        },
        taxId,
        registrationNumber,
        website,
        phone,
        email,
        ownerId: new ObjectId(userId),
        members: [
          {
            userId: new ObjectId(userId),
            role: "owner",
            addedAt: new Date(),
          },
        ],
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await companiesCollection.insertOne(newCompany);

      // Update user with role and companyId
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            role: "owner",
            companyId,
            companySetupCompletedAt: new Date(),
          },
        }
      );

      logger.info("Company created successfully", {
        companyId,
        userId,
      });

      // Seed default chart of accounts for the new company
      try {
        await seedAccountsForCompany(result.insertedId.toString());
        logger.info("Default accounts seeded for company", { companyId });
      } catch (seedError) {
        // Log but don't fail company creation if seeding fails
        logger.logError(seedError as Error, {
          operation: "seed-accounts-on-company-create",
          companyId,
        });
      }

      return {
        _id: result.insertedId,
        companyId,
        name: companyName,
      };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "create-company",
        companyId: companyData.companyId,
      });
      throw error;
    }
  },

  /**
   * Get company by companyId
   */
  getCompanyById: async (companyId: string) => {
    try {
      const company = await companiesCollection.findOne({ companyId });

      if (!company) {
        throw new Error("Company not found");
      }

      return company;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "get-company-by-id",
        companyId,
      });
      throw error;
    }
  },

  /**
   * Update company
   */
  updateCompany: async (
    companyId: string,
    updateData: Record<string, unknown>
  ) => {
    try {
      // Remove fields that shouldn't be updated
      const sanitizedData = { ...updateData };
      delete sanitizedData.companyId;
      delete sanitizedData.ownerId;
      delete sanitizedData.createdAt;

      const result = await companiesCollection.updateOne(
        { companyId },
        {
          $set: {
            ...sanitizedData,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error("Company not found");
      }

      logger.info("Company updated successfully", {
        companyId,
      });

      return { companyId, updated: true };
    } catch (error) {
      logger.logError(error as Error, {
        operation: "update-company",
        companyId,
      });
      throw error;
    }
  },
};

export default companyService;
