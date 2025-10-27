import express from "express";
import admin from "../../firebase-admin.js";
import Mux from "@mux/mux-node";
import { verifyUserPurchase } from "../../services/verifyPurchase.js";

const router = express.Router();

// 🔑 Credenciales Mux (desde variables de entorno)
const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = process.env;
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

router.post("/", async (req, res) => {
  try {
    const { idToken, courseId, videoId } = req.body;

    if (!idToken || !courseId || !videoId) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // 🔹 Verificar token Firebase
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userId = decoded.uid;

    // 🔹 Verificar que el usuario tenga acceso al curso
    const hasAccess = await verifyUserPurchase(userId, courseId);
    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes acceso a este curso" });
    }

    // 🔹 Crear token de reproducción temporal para el video de Mux
    const playbackId = videoId; // Asegúrate que tu videoId sea el playbackId o assetId de Mux
    const playbackToken = await mux.video.playbackIds.create(playbackId, {
      policy: "signed",
    });

    res.json({
      token: playbackToken.id,
      playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`,
    });
  } catch (error) {
    console.error("Error generando playback token:", error);
    res.status(500).json({ error: "Error generando playback token" });
  }
});

export default router;
