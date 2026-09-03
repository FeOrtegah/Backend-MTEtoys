import jwt from "jsonwebtoken";


// =====================================================
// PROTEGER RUTA
// =====================================================
// Lee el JWT desde la cookie httpOnly "token" (la pone
// el login). Ya no viaja en el header Authorization ni
// se guarda en localStorage del navegador.

export const protegerRuta = (
  req,
  res,
  next
) => {

  const token =
    req.cookies?.token;


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