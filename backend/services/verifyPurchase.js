import { db } from "../firebase-admin.js";

export async function verifyUserPurchase(userId, courseId) {
  try {
    const purchasesRef = db.collection("purchases");
    const snapshot = await purchasesRef
      .where("userId", "==", userId)
      .where("courseId", "==", courseId)
      .where("status", "==", "paid")
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error("Error verificando la compra:", error);
    return false;
  }
}
