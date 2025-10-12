import { db } from "../db.js";

export async function verifyUserPurchase(userId, courseId) {
  const purchase = await db.purchases.findFirst({
    where: { userId, courseId, status: "paid" },
  });
  return !!purchase;
}
