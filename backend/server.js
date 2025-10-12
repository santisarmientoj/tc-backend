import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import stripeRoutes from "./routes/stripe.js";


dotenv.config();

// 🔹 Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔹 Inicializar Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use("/api/stripe", stripeRoutes);
app.use("/api/stripe/webhook", stripeRoutes);

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// ✅ Middleware CORS
app.use(cors());

// ⚠️ El webhook NECESITA raw body (antes de express.json)
app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos de Stripe
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = session.metadata.userId;
    const courseId = session.metadata.courseId;

    console.log(`✅ Compra confirmada: User ${userId} -> Curso ${courseId}`);

    try {
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        coursesPurchased: admin.firestore.FieldValue.arrayUnion(courseId),
      });
      console.log(`🔥 Firestore actualizado para usuario ${userId}`);
    } catch (err) {
      console.error("❌ Error actualizando Firestore:", err);
    }
  }

  res.json({ received: true });
});

// ✅ JSON middleware para los demás endpoints
app.use(express.json());

// ✅ Servir archivos estáticos desde "../frontend"
app.use(express.static(path.join(__dirname, "../frontend")));


// ✅ Rutas explícitas para HTML de éxito, cancelación y dashboard
app.get("/success.html", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "success.html"));
});

app.get("/cancel.html", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "cancel.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dashboard.html"));
});

// 🔹 Crear sesión de checkout
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: "Faltan parámetros." });
    }

    const prices = {
      armonia: "price_1SDH61CL7DbPoSIwYMB3xA1D",
      tecnica: "price_1SDH8dCL7DbPoSIwmCR8DT8y",
      ritmo: "price_1SDHBwCL7DbPoSIwi0G3x0xq",
    };

    const priceId = prices[courseId];
    if (!priceId) {
      return res.status(400).json({ error: "Curso inválido." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      // ✅ Stripe redirige aquí después del pago
      success_url: "https://tutorialescristianos.app/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://tutorialescristianos.app/cancel.html",
      metadata: { userId, courseId },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creando checkout:", error);
    res.status(500).json({ error: "Error creando sesión de checkout" });
  }
});

// 🔹 Endpoint para consultar una sesión de checkout
app.get("/checkout-session", async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 Integración con Mux para uploads de video
import Mux from "@mux/mux-node";

const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Endpoint para crear un nuevo upload URL
app.post("/create-upload", async (req, res) => {
  try {
    const upload = await Video.Uploads.create({
      new_asset_settings: { playback_policy: "signed" },
    });
    res.json(upload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating upload URL" });
  }
});


// 🔹 Página de estado
app.get("/", (req, res) => {
  res.send(`
    <h1>🚀 Servidor de E-Learning Funcionando</h1>
    <ul>
      <li>POST <code>/create-checkout-session</code></li>
      <li>POST <code>/webhook</code></li>
      <li>GET <code>/health</code></li>
      <li>Visita <code>/success.html</code> o <code>/cancel.html</code> en el navegador</li>
    </ul>
  `);
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});








