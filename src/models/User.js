import mongoose from "mongoose";

const direccionSchema = new mongoose.Schema(
  {
    calle: { type: String, default: "" },
    numero: { type: String, default: "" },
    comuna: { type: String, default: "" },
    region: { type: String, default: "" },
    indicaciones: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
    nombre: { type: String, default: "" },
    telefono: { type: String, default: "" },
    direccion: { type: direccionSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);