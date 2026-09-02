import Review from "../models/Review.js";
import User from "../models/User.js";

// =====================================================
// LISTAR RESEÑAS DE UN PRODUCTO/COMBO
// =====================================================
// Pública: cualquiera puede leer las reseñas.

export const getReviewsByProduct = async (req, res) => {
  try {
    const { tipo, producto } = req.params;

    const reseñas = await Review.find({
      producto,
      tipo,
    }).sort({ createdAt: -1 });

    res.json(reseñas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// CREAR RESEÑA
// =====================================================
// Requiere sesión iniciada. Un usuario solo puede dejar
// una reseña por producto (el índice único del modelo lo
// garantiza a nivel de base de datos).

export const createReview = async (req, res) => {
  try {
    const { producto, tipo, calificacion, comentario } = req.body;

    if (!producto || !calificacion || !comentario) {
      return res.status(400).json({
        message: "Faltan datos de la reseña",
      });
    }

    const calNum = Number(calificacion);

    if (!calNum || calNum < 1 || calNum > 5) {
      return res.status(400).json({
        message: "La calificación debe ser entre 1 y 5",
      });
    }

    const textoComentario = String(comentario).trim();

    if (!textoComentario || textoComentario.length > 600) {
      return res.status(400).json({
        message: "El comentario debe tener entre 1 y 600 caracteres",
      });
    }

    const usuario = await User.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const nueva = await Review.create({
      producto,
      tipo: tipo === "combo" ? "combo" : "producto",
      usuario: req.usuario.id,
      nombre: usuario.nombre || usuario.email,
      calificacion: calNum,
      comentario: textoComentario,
    });

    res.status(201).json(nueva);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Ya dejaste una reseña para este producto",
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// ELIMINAR RESEÑA
// =====================================================
// Solo admin.

export const deleteReview = async (req, res) => {
  try {
    const reseña = await Review.findByIdAndDelete(req.params.id);

    if (!reseña) {
      return res.status(404).json({ message: "Reseña no encontrada" });
    }

    res.json({ message: "Reseña eliminada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};