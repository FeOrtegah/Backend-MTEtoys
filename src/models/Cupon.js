import mongoose from "mongoose";

// =====================================================
// CUPÓN DE DESCUENTO
// =====================================================
// Dos formas de usarlo:
//
// 1) Código ÚNICO (el más robusto): el admin genera un
//    lote de códigos aleatorios, cada uno con usosMaximos=1.
//    Se reparte uno por persona (email, WhatsApp, etc.).
//
// 2) Código GENÉRICO (ej: NAVIDAD10): lo conoce todo el
//    mundo, pero igual se permite UN solo uso por persona,
//    controlado por RUT / email / teléfono / dirección.
//
// "campania" agrupa códigos que comparten la regla de
// "una vez por persona": un lote entero es una campaña, así
// nadie puede canjear dos códigos del mismo lote.

const cuponSchema = new mongoose.Schema(
  {
    // Siempre en mayúsculas y solo letras/números.
    codigo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },

    campania: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 40,
      index: true,
    },

    descripcion: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    tipo: {
      type: String,
      enum: ["porcentaje", "monto"],
      required: true,
    },

    // porcentaje: 1-90 | monto: pesos CLP
    valor: {
      type: Number,
      required: true,
      min: 1,
    },

    // Compra mínima (subtotal de productos) para poder usarlo
    montoMinimo: {
      type: Number,
      default: 0,
      min: 0,
    },

    fechaInicio: { type: Date, default: null },
    fechaFin: { type: Date, default: null },

    // null = sin límite total de usos
    usosMaximos: {
      type: Number,
      default: null,
      min: 1,
    },

    // Usos reservados + confirmados (se libera si el
    // pedido se cancela o expira).
    usosActuales: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Opcional: si se asigna un email, solo esa persona
    // puede usar el código (email canónico).
    emailAsignado: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Cupon", cuponSchema);
