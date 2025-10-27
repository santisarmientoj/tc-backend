// /backend/routes/verifyPurchase.js
import express from "express";
import { verifyUserPurchase } from "../services/verifyPurchase.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

// 👇 Ruta raíz (sin repetir /verify-purchase)
router.post("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ accessGranted: false, message: "Falta el ID del curso" });
    }

    const hasAccess = await verifyUserPurchase(userId, courseId);

    if (hasAccess) {
      return res.json({ accessGranted: true });
    } else {
      return res.status(403).json({ accessGranted: false, message: "No tienes acceso a este curso" });
    }
  } catch (error) {
    console.error("Error en verify-purchase:", error);
    res.status(500).json({ accessGranted: false, message: "Error del servidor" });
  }
});

export default router;


