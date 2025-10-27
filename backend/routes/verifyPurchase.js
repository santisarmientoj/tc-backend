import express from "express";
import { verifyUserPurchase } from "../services/verifyPurchase.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/verify-purchase", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid; // ← viene del token
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Falta el ID del curso" });
    }

    const hasAccess = await verifyUserPurchase(userId, courseId);

    if (hasAccess) return res.json({ accessGranted: true });
    return res.status(403).json({ accessGranted: false });
  } catch (error) {
    console.error("Error en verify-purchase:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

export default router;
