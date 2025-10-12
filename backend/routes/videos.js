import express from "express";
import Mux from "@mux/mux-node";
import { verifyUserPurchase } from "../services/verifyPurchase.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// 🎬 Endpoint para generar una URL de reproducción segura
router.get("/:courseId/playback", authenticateUser, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Verifica si el usuario ha comprado el curso
    const hasAccess = await verifyUserPurchase(userId, courseId);
    if (!hasAccess) {
      return res.status(403).json({ message: "No tienes acceso a este curso" });
    }

    // Busca el curso en la base de datos
    const course = await getCourseFromDB(courseId); // reemplaza con tu método real
    if (!course || !course.muxPlaybackId) {
      return res.status(404).json({ message: "Video no encontrado" });
    }

    // Crea playback ID firmado
    const playbackToken = await Video.PlaybackIds.create(course.muxPlaybackId, {
      policy: "signed",
    });

    const playbackUrl = `https://stream.mux.com/${playbackToken.id}.m3u8`;

    res.json({ playbackUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al generar el token de reproducción" });
  }
});

export default router;

