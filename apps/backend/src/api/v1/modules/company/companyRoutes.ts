import express, { Router } from "express";
import companyController from "./companyController.js";

const companyRoutes: Router = express.Router();

// Create a new company
companyRoutes.post("/", companyController.createCompany);

// Get company by companyId
companyRoutes.get("/:companyId", companyController.getCompanyById);

// Update company
companyRoutes.put("/:companyId", companyController.updateCompany);

export default companyRoutes;
