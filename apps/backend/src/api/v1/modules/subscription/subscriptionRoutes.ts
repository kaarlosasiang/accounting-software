import express from "express";

import subscriptionController from "./subscriptionController";

const subscriptionRoutes = express.Router();

subscriptionRoutes.post(
  "/activate",
  subscriptionController.activateSubscription
);

subscriptionRoutes.get("/:userId", subscriptionController.getSubscription);

subscriptionRoutes.delete(
  "/:userId",
  subscriptionController.cancelSubscription
);

export default subscriptionRoutes;
