import mongoose from "mongoose";


// =====================================================
// ESQUEMA DE DIRECCIÓN
// =====================================================

const direccionSchema = new mongoose.Schema(
  {
    etiqueta: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    nombreReceptor: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    rut: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12,
    },

    telefono: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    calle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    numero: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    departamento: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    comuna: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    indicaciones: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    predeterminada: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);


// =====================================================
// ESQUEMA DE USUARIO
// =====================================================

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: true,
    },

    rol: {
      type: String,
      enum: ["admin", "cliente"],
      default: "cliente",
    },

    nombre: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    telefono: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },

    // -------------------------------------------------
    // DIRECCIÓN ANTIGUA
    // -------------------------------------------------
    // La mantenemos temporalmente para NO romper
    // usuarios existentes de MongoDB.

    direccion: {
      type: {
        calle: {
          type: String,
          default: "",
          trim: true,
        },

        numero: {
          type: String,
          default: "",
          trim: true,
        },

        comuna: {
          type: String,
          default: "",
          trim: true,
        },

        region: {
          type: String,
          default: "",
          trim: true,
        },

        indicaciones: {
          type: String,
          default: "",
          trim: true,
        },
      },

      default: () => ({}),
    },


    // -------------------------------------------------
    // NUEVAS DIRECCIONES
    // -------------------------------------------------

    direcciones: {
      type: [direccionSchema],
      default: [],
    },
  },

  {
    timestamps: true,
  }
);


// =====================================================
// EXPORTAR
// =====================================================

export default mongoose.model(
  "User",
  userSchema
);