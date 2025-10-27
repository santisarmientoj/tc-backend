import admin from "../firebase-admin.js";

export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ Verificamos el ID token con Firebase Admin (no con jwt.verify)
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Guardamos los datos del usuario en la request
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error al autenticar usuario:", error.message);
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
}



