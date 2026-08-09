import mongoose from "mongoose";

const comboSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    productoPrincipal: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productoAdicional: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    cantidadAdicional: { type: Number, default: 1, min: 1 },
    precioCombo: { type: Number, required: true, min: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Combo", comboSchema);