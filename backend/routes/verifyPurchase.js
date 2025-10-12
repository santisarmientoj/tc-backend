// backend/routes/verifyPurchase.js
import express from "express";
import { verifyUserPurchase } from "../services/verifyPurchase.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: "Missing userId or courseId" });
    }

    const hasAccess = await verifyUserPurchase(userId, courseId);

    res.json({ access: hasAccess });
  } catch (error) {
    console.error("Error verifying purchase:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
