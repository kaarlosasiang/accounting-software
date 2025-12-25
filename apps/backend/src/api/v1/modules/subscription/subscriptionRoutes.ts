import express from "express";

import subscriptionController from "./subscriptionController";

const subscriptionRoutes = express.Router();

subscriptionRoutes.post(
  "/activate",
  subscriptionController.activateSubscription
);

export default subscriptionRoutes;
