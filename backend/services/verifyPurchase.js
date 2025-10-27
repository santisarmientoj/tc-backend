import express from "express";
import { db } from "../firebase-admin.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/verify-purchase", authenticateUser, async (req, res) => {
  try {
    // ✅ Obtenemos el userId desde el token, no desde el body
    const userId = req.user.uid;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Falta el ID del curso" });
    }

    // 🔍 Consultamos en Firestore si el usuario tiene una compra con estado 'paid'
    const purchasesRef = db.collection("purchases");
    const snapshot = await purchasesRef
      .where("userId", "==", userId)
      .where("courseId", "==", courseId)
      .where("status", "==", "paid")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return res.json({ accessGranted: true });
    }

    return res.status(403).json({ accessGranted: false });
  } catch (error) {
    console.error("Error verificando la compra:", error);
    return res.status(500).json({ message: "Error del servidor" });
  }
});

export default router;

