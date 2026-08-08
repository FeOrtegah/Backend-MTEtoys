import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: "" },
    precio: { type: Number, required: true, min: 0 },
    categoria: { type: String, default: "General" },
    imagenes: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);