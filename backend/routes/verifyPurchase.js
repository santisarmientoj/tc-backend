import express from "express";
import { verifyUserPurchase } from "../services/verifyPurchase.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/verify-purchase", authMiddleware, async (req, res) => {
  const { userId, courseId } = req.body;

  const hasAccess = await verifyUserPurchase(userId, courseId);

  if (hasAccess) {
    return res.json({ accessGranted: true });
  }

  return res.status(403).json({ accessGranted: false });
});

export default router;

