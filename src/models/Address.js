import mongoose from "mongoose";

// =====================================================
// DIRECCIÓN GUARDADA
// =====================================================
// Cada usuario puede guardar varias direcciones de envío
// (ej: "Casa", "Trabajo", "Pareja") y elegir entre ellas
// directamente en el checkout.

const addressSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Etiqueta que el propio cliente le pone a la dirección
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    nombreReceptor: {
      type: String,
      required: true,
      trim: true,
    },

    rut: {
      type: String,
      default: "",
      trim: true,
    },

    telefono: {
      type: String,
      required: true,
      trim: true,
    },

    direccion: {
      type: String,
      required: true,
      trim: true,
    },

    numero: {
      type: String,
      required: true,
      trim: true,
    },

    departamento: {
      type: String,
      default: "",
      trim: true,
    },

    region: {
      type: String,
      required: true,
      trim: true,
    },

    comuna: {
      type: String,
      required: true,
      trim: true,
    },

    indicaciones: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Address", addressSchema);