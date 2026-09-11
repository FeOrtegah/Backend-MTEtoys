import mongoose from "mongoose";
import { generarSlugUnico } from "../utils/slugify.js";

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    descripcion: { type: String, default: "" },
    precio: { type: Number, required: true, min: 0 },
    precioOferta: { type: Number, default: null, min: 0 },
    enOferta: { type: Boolean, default: false },
    destacado: { type: Boolean, default: false },
    categoria: { type: String, default: "General" },
    imagenes: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    activo: { type: Boolean, default: true },

    // Dimensiones de envío (para calcular costos con
    // couriers a futuro, y para que el cliente sepa qué
    // tan grande es el paquete antes de comprar).
    dimensiones: {
      largo: { type: Number, default: null, min: 0 }, // cm
      ancho: { type: Number, default: null, min: 0 }, // cm
      alto: { type: Number, default: null, min: 0 }, // cm
      peso: { type: Number, default: null, min: 0 }, // kg
    },

    // Rango de edad recomendado, en MESES (para tener una
    // sola unidad: 0-12 meses = 0 a 12, 1-2 años = 12 a 24,
    // etc). Se usa para el filtro "Regalos por edad".
    edadMinima: { type: Number, default: null, min: 0 },
    edadMaxima: { type: Number, default: null, min: 0 },
  },
  { timestamps: true }
);

// Genera/actualiza el slug cuando el nombre es nuevo o cambió
productSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("nombre")) {
    this.slug = await generarSlugUnico(this.constructor, this.nombre, this._id);
  }
  next();
});

export default mongoose.model("Product", productSchema);