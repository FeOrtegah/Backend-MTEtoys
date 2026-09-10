import mongoose from "mongoose";


// =====================================================
// ITEM DEL PEDIDO
// =====================================================

const orderItemSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },

    precioUnitario: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);


// =====================================================
// DATOS DE FACTURACIÓN
// =====================================================

const facturacionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    rut: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 12,
    },

    direccion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    numero: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },

    departamento: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },

    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    comuna: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false }
);


// =====================================================
// DATOS DE ENVÍO
// =====================================================

const envioSchema = new mongoose.Schema(
  {
    nombreReceptor: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    telefono: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    direccion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    numero: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },

    departamento: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },

    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    comuna: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    indicaciones: {
      type: String,
      default: "",
      trim: true,
      maxlength: 250,
    },
  },
  { _id: false }
);


// =====================================================
// PEDIDO
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    cliente: {
      nombre: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 150,
      },

      rut: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 12,
      },

      telefono: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
      },

      // -----------------------------------------------
      // FACTURACIÓN
      // -----------------------------------------------

      facturacion: {
        type: facturacionSchema,
        required: true,
      },

      // -----------------------------------------------
      // ENVÍO
      // -----------------------------------------------

      envio: {
        type: envioSchema,
        required: true,
      },

      // -----------------------------------------------
      // COMPATIBILIDAD CON PEDIDOS ANTIGUOS
      // -----------------------------------------------

      // Se mantiene para que los pedidos antiguos
      // no tengan problemas al ser leídos.
      direccion: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // -----------------------------------------------
    // PRODUCTOS
    // -----------------------------------------------

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "El pedido debe contener al menos un producto",
      },
    },

    // -----------------------------------------------
    // TOTALES
    // -----------------------------------------------

    // Suma de los productos, SIN el envío.
    totalProductos: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total final: productos + envío.
    // Es el monto que se cobra en Webpay.
    total: {
      type: Number,
      required: true,
      min: 1,
    },

    // -----------------------------------------------
    // ENVÍO
    // -----------------------------------------------

    metodoEnvio: {
      type: String,
      enum: ["Logística 360", "Bluexpress", "Starken", "Chilexpress", "Retiro en sede", null],
      default: null,
    },

    costoEnvio: {
      type: Number,
      default: 0,
      min: 0,
    },

    // -----------------------------------------------
    // ESTADO
    // -----------------------------------------------

    estado: {
      type: String,
      enum: [
        "pendiente",
        "pagado",
        "preparando",
        "enviado",
        "cancelado",
      ],
      default: "pendiente",
    },

    // -----------------------------------------------
    // MÉTODO DE PAGO
    // -----------------------------------------------

    metodoPago: {
      type: String,
      default: "webpay",
      trim: true,
    },

    // -----------------------------------------------
    // AVISO DE TRANSFERENCIA POR WHATSAPP
    // -----------------------------------------------
    // Se marca cuando el cliente hace clic en el botón
    // "Avisar por WhatsApp" en la página de transferencia.
    // Es solo informativo para el admin, no confirma el
    // pago por sí solo (eso lo hace confirmPayment).

    avisoWhatsappEnviado: {
      type: Boolean,
      default: false,
    },

    avisoWhatsappFecha: {
      type: Date,
      default: null,
    },

    // -----------------------------------------------
    // CÓDIGO DE TRANSACCIÓN
    // -----------------------------------------------

    codigoTransaccion: {
      type: String,
      default: "",
      trim: true,
    },

    // -----------------------------------------------
    // TOKEN DE ACCESO
    // -----------------------------------------------
    // Se genera al crear el pedido y se entrega una sola
    // vez al cliente en la respuesta de creación.
    // Se exige para iniciar el pago en Webpay, de modo
    // que no baste con conocer/adivinar el ID del pedido.
    // select:false => no se filtra en consultas normales
    // (getOrders, getMyOrders, getOrderById).

    accessToken: {
      type: String,
      select: false,
    },
  },

  {
    timestamps: true,
  }
);


// =====================================================
// ÍNDICES
// =====================================================

orderSchema.index({
  "cliente.email": 1,
});

orderSchema.index({
  estado: 1,
});

orderSchema.index({
  createdAt: -1,
});


export default mongoose.model(
  "Order",
  orderSchema
);