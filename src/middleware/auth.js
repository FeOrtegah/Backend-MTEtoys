import jwt from "jsonwebtoken";

export const protegerRuta = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado, falta token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Usar DESPUÉS de protegerRuta — exige además que el usuario sea admin.
export const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({ message: "Acceso solo para administradores" });
  }
  next();
};