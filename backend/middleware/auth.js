import admin from "firebase-admin";

export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    // 🔥 Verifica token de Firebase directamente
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error al autenticar usuario Firebase:", error.message);
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
}


