import express from "express";
import admin from "firebase-admin";
import mux from "@mux/mux-node";

const router = express.Router();
const { Video } = new mux();

async function verifyCoursePurchase(userId, courseId) {
  const db = admin.firestore();

  const doc = await db.collection("purchases").doc(`${userId}_${courseId}`).get();

  if (!doc.exists) return false;

  const purchaseData = doc.data();
  return purchaseData.status === "paid";
}


router.get("/:courseId/playback", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const userId = decoded.uid;
    const courseId = req.params.courseId;

    // 🔹 Verificar compra en Firestore
    const hasPurchased = await verifyCoursePurchase(userId, courseId);
    if (!hasPurchased) {
      return res.status(403).json({ error: "No has comprado este curso" });
    }

    // 🔹 Generar playback token de Mux
    const playbackId = "tu_playback_id_de_mux"; // 🔸 cambia esto por el ID real
    const signedPlayback = await Video.PlaybackID.create(playbackId, {
      policy: "signed",
    });

    const playbackUrl = `https://stream.mux.com/${signedPlayback.id}.m3u8`;
    res.json({ playbackUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el video" });
  }
});


export default router;


