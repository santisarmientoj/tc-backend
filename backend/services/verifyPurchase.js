// /backend/services/verifyPurchase.js
import admin from "../firebase-admin.js";

export async function verifyUserPurchase(userId, courseId) {
  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(`❌ No se encontró el usuario ${userId}`);
      return false;
    }

    const userData = userSnap.data();
    const courses = userData.coursesPurchased || [];

    const hasAccess = courses.includes(courseId);

    console.log(`🔎 Verificando acceso para ${userId} al curso ${courseId}: ${hasAccess ? "✅ Permitido" : "❌ Denegado"}`);

    return hasAccess;
  } catch (error) {
    console.error("Error verificando la compra:", error);
    return false;
  }
}




