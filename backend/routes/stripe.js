import express from "express";
import Stripe from "stripe";
import admin from "firebase-admin";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe requiere el cuerpo en formato "raw"
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // 🔹 Recuperamos la metadata con los IDs
      const userId = session.metadata?.firebase_user_id;
      const courseId = session.metadata?.firebase_course_id;

      if (userId && courseId) {
        // Guardamos la compra en Firestore
        const db = admin.firestore();
        await db
          .collection("purchases")
          .doc(`${userId}_${courseId}`)
          .set({
            userId,
            courseId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            stripeSessionId: session.id,
            status: "paid",
          });
        console.log(`✅ Compra registrada para ${userId} - curso ${courseId}`);
      }
    }

    res.status(200).send("Webhook recibido");
  } catch (err) {
    console.error("❌ Error en webhook:", err.message);
    res.status(400).send(`Webhook error: ${err.message}`);
  }
});

export default router;
