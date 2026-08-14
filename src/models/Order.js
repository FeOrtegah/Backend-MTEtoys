import mongoose from "mongoose";


const orderItemSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  nombre: {
    type: String,
    required: true,
  },

  cantidad: {
    type: Number,
    required: true,
    min: 1,
  },

  precioUnitario: {
    type: Number,
    required: true,
  },
});


const orderSchema = new mongoose.Schema(
  {
    cliente: {

      nombre: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      telefono: {
        type: String,
        default: "",
      },

      direccion: {
        type: String,
        default: "",
      },
    },


    items: [orderItemSchema],


    total: {
      type: Number,
      required: true,
    },


    estado: {
      type: String,

      enum: [
        "pendiente",
        "pagado",
        "enviado",
        "cancelado",
      ],

      default: "pendiente",
    },


    metodoPago: {
      type: String,
      default: "webpay_link",
    },


    codigoTransaccion: {
      type: String,
      default: "",
    },
  },

  {
    timestamps: true,
  }
);


export default mongoose.model(
  "Order",
  orderSchema
);