import express, { Router } from "express";
import customerController from "./customerController.js";

const customerRoutes: Router = express.Router();

// Create a new customer
customerRoutes.post("/", customerController.createCustomer);

// Get all customers
customerRoutes.get("/", customerController.getAllCustomers);

// Get active customers
customerRoutes.get("/active", customerController.getActiveCustomers);

// Search customers
customerRoutes.get("/search", customerController.searchCustomers);

// Get customer by customer code
customerRoutes.get("/code/:code", customerController.getCustomerByCode);

// Get customer by ID
customerRoutes.get("/:id", customerController.getCustomerById);

// Update a customer
customerRoutes.put("/:id", customerController.updateCustomer);

// Delete a customer
customerRoutes.delete("/:id", customerController.deleteCustomer);

// Toggle customer active status
customerRoutes.patch(
  "/:id/toggle-status",
  customerController.toggleCustomerStatus
);

// Update customer balance
customerRoutes.patch("/:id/balance", customerController.updateCustomerBalance);

// Check credit availability
customerRoutes.post(
  "/:id/check-credit",
  customerController.checkCreditAvailability
);

export default customerRoutes;
