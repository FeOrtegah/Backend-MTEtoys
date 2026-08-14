import jwt from "jsonwebtoken";


// =====================================================
// PROTEGER RUTA
// =====================================================

export const protegerRuta = (
  req,
  res,
  next
) => {

  const authHeader =
    req.headers.authorization;


  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message:
        "No autorizado, falta token",
    });
  }


  const token =
    authHeader.split(" ")[1];


  if (!token) {
    return res.status(401).json({
      message:
        "No autorizado, falta token",
    });
  }


  try {

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    req.usuario =
      decoded;


    next();


  } catch (error) {

    console.error(
      "Error verificando JWT:",
      error.message
    );


    return res.status(401).json({
      message:
        "Token inválido o expirado",
    });
  }
};


// =====================================================
// SOLO ADMIN
// =====================================================

export const soloAdmin = (
  req,
  res,
  next
) => {

  if (
    req.usuario?.rol !== "admin"
  ) {

    return res.status(403).json({
      message:
        "Acceso solo para administradores",
    });
  }


  next();
};