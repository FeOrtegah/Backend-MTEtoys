import mongoose from "mongoose";

// =====================================================
// ETIQUETAS ESTACIONALES / PROMOCIONALES
// =====================================================
// Cintillos programables (Ciber, Navidad, Black Week,
// etc.) que el admin crea con un rango de fechas y un
// color de fondo. El frontend muestra automáticamente
// la(s) que estén vigentes según la fecha de hoy, sin
// necesidad de un cambio de código.

const etiquetaSchema = new mongoose.Schema(
  {
    texto: { type: String, required: true, trim: true },

    // Color de fondo del cintillo/etiqueta (hex).
    color: { type: String, required: true, default: "#E94F37" },

    // Color del texto sobre el fondo (hex).
    colorTexto: { type: String, default: "#FFFFFF" },

    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },

    // Permite al admin desactivarla manualmente aunque
    // esté dentro del rango de fechas.
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Etiqueta", etiquetaSchema);
