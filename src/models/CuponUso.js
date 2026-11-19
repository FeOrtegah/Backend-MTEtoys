import mongoose from "mongoose";

// =====================================================
// USO DE CUPÓN (una fila por persona y campaña)
// =====================================================
// Los índices ÚNICOS son la garantía real de "una vez por
// persona": aunque lleguen dos pedidos al mismo tiempo,
// MongoDB rechaza el segundo. No dependemos de un "if".
//
// Se identifica a la persona por varios datos del checkout
// a la vez (RUT, email normalizado, teléfonos y direcciones).
// Si CUALQUIERA coincide con un uso previo de la campaña,
// se rechaza.
//
// Al cancelarse/expirar el pedido la fila se BORRA, así la
// persona puede volver a intentarlo con otro pedido.

const cuponUsoSchema = new mongoose.Schema(
  {
    cupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cupon",
      required: true,
      index: true,
    },

    codigo: { type: String, required: true },
    campania: { type: String, required: true },

    pedido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    rut: { type: String, required: true },
    email: { type: String, required: true },
    telefonos: { type: [String], default: [] },
    direcciones: { type: [String], default: [] },

    descuento: { type: Number, default: 0 },

    estado: {
      type: String,
      enum: ["reservado", "usado"],
      default: "reservado",
    },
  },
  { timestamps: true }
);

cuponUsoSchema.index({ campania: 1, rut: 1 }, { unique: true });
cuponUsoSchema.index({ campania: 1, email: 1 }, { unique: true });
cuponUsoSchema.index({ campania: 1, telefonos: 1 }, { unique: true });
cuponUsoSchema.index({ campania: 1, direcciones: 1 }, { unique: true });

export default mongoose.model("CuponUso", cuponUsoSchema);
