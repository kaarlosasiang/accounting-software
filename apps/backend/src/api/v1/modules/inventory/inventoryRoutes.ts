import express from "express";

import inventoryController from "./inventoryController";

const inventoryRoutes = express.Router();

inventoryRoutes.post("/add", inventoryController.addInventoryItem);

export default inventoryRoutes;
