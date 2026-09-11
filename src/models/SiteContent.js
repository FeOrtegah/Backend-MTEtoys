import mongoose from "mongoose";

// =====================================================
// CONTENIDO DEL SITIO (editable desde el admin)
// =====================================================
// Un solo modelo genérico para varias secciones del home
// que el admin puede editar directamente sobre la página:
//   - "banner"    → banners rotativos del inicio
//   - "brand"     → logos de "Compra por marca"
//   - "giftCard"  → tarjetas de "Regalos por Precio"
//   - "productAd" → imágenes verticales al lado del
//                   listado de productos (/productos)

const siteContentSchema = new mongoose.Schema(
  {
    seccion: {
      type: String,
      required: true,
      enum: [
        "banner",
        "brand",
        "giftCard",
        "productAd",
        "ageGiftCard",
        "secondaryBanner",
      ],
    },

    orden: { type: Number, default: 0 },

    // Obligatoria para banners/marcas/regalos por
    // precio; las tarjetas de "Regalos por edad" no
    // llevan imagen (son figuras de color), por eso
    // ya no es obligatoria a nivel de esquema.
    imagen: { type: String, default: "" },

    titulo: { type: String, default: "" },
    subtitulo: { type: String, default: "" },

    // A dónde lleva la tarjeta al hacer click
    // (ej: /productos?categoria=mattel, /productos?min=1&max=10000)
    link: { type: String, default: "" },

    // Solo para "ageGiftCard": rango de edad en meses,
    // usado para armar el link de filtro automáticamente.
    edadMinima: { type: Number, default: null },
    edadMaxima: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("SiteContent", siteContentSchema);