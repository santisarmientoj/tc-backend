// /backend/middleware/auth.js
import admin from "../firebase-admin.js";

export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no proporcionado o malformado" });
    }

    const token = authHeader.split(" ")[1];

    // Verificamos el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    if (!decodedToken || !decodedToken.uid) {
      return res.status(403).json({ message: "Token inválido o sin UID" });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error al autenticar usuario:", error.message);
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
}




