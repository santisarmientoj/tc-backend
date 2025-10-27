import { db } from "../firebase-admin.js";

export async function verifyUserPurchase(userId, courseId) {
  const purchasesRef = db.collection("purchases");
  const snapshot = await purchasesRef
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .where("status", "==", "paid")
    .limit(1)
    .get();

  return !snapshot.empty;
}


