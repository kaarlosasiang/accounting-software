import { Router } from "express";

import { requireAuth } from "../shared/middleware/auth.middleware";

const router = Router();

// Example user routes
router.use(requireAuth);

router.get("/", (req, res) => {
  // TODO: Get all users
  res.json({ message: "Get all users" });
});

router.get("/:id", (req, res) => {
  // TODO: Get user by ID
  res.json({ message: `Get user ${req.params.id}` });
});

router.post("/", (req, res) => {
  // TODO: Create user
  res.json({ message: "Create user" });
});

router.put("/:id", (req, res) => {
  // TODO: Update user
  res.json({ message: `Update user ${req.params.id}` });
});

router.delete("/:id", (req, res) => {
  // TODO: Delete user
  res.json({ message: `Delete user ${req.params.id}` });
});

export default router;
