import mongoose from "mongoose";

// =====================================================
// RESEÑA DE PRODUCTO
// =====================================================
// Solo la puede crear un cliente con sesión iniciada.
// Un usuario puede dejar como máximo una reseña por
// producto (índice único abajo).

const reviewSchema = new mongoose.Schema(
  {
    producto: {
      type: String,
      required: true,
    },

    tipo: {
      type: String,
      enum: ["producto", "combo"],
      default: "producto",
    },

    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Nombre del cliente al momento de reseñar (así se
    // sigue mostrando aunque después cambie su nombre
    // de perfil).
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    calificacion: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comentario: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600,
    },
  },
  { timestamps: true }
);

reviewSchema.index(
  { producto: 1, tipo: 1, usuario: 1 },
  { unique: true }
);

export default mongoose.model("Review", reviewSchema);