import express from "express";
import { MongoClient, ObjectId } from "mongodb";

import { constants } from "../config";

const router = express.Router();

// MongoDB connection for company operations
const mongoClient = new MongoClient(constants.mongodbUri);
const db = mongoClient.db(constants.dbName);
const companiesCollection = db.collection("companies");
const usersCollection = db.collection("user");

/**
 * Create a new company
 * POST /api/v1/companies
 */
router.post("/", async (req, res) => {
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
    } = req.body;

    if (!userId || !companyName || !companyId) {
      return res.status(400).json({
        success: false,
        message: "userId, companyName, and companyId are required",
      });
    }

    // Check if company ID already exists
    const existingCompany = await companiesCollection.findOne({ companyId });
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "Company ID already exists",
      });
    }

    // Create company document
    const companyData = {
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

    const result = await companiesCollection.insertOne(companyData);

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

    return res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: {
        _id: result.insertedId,
        companyId,
        name: companyName,
      },
    });
  } catch (error) {
    console.error("Error creating company:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create company",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get company by companyId
 * GET /api/v1/companies/:companyId
 */
router.get("/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await companiesCollection.findOne({ companyId });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Update company
 * PUT /api/v1/companies/:companyId
 */
router.put("/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.companyId;
    delete updateData.ownerId;
    delete updateData.createdAt;

    const result = await companiesCollection.updateOne(
      { companyId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update company",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
