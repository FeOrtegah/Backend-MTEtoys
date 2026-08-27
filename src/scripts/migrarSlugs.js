// Script de migración: genera un slug para todos los productos
// que aún no lo tengan (ej: los ~57 productos ya cargados).
//
// Uso:
//   node src/scripts/migrarSlugs.js
//
// Requiere que MONGO_URI esté definida en tu archivo .env

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { generarSlugUnico } from "../utils/slugify.js";

dotenv.config();

async function migrar() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI no está definida en las variables de entorno");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Conectado a MongoDB");

  const productosSinSlug = await Product.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
  });

  console.log(`Productos sin slug encontrados: ${productosSinSlug.length}`);

  let actualizados = 0;
  for (const producto of productosSinSlug) {
    const slug = await generarSlugUnico(Product, producto.nombre, producto._id);
    producto.slug = slug;
    // Guardamos con validateBeforeSave: false para no re-disparar
    // validaciones innecesarias sobre otros campos ya válidos
    await producto.save({ validateBeforeSave: false });
    console.log(`  "${producto.nombre}" -> ${slug}`);
    actualizados++;
  }

  console.log(`\nListo. ${actualizados} producto(s) actualizado(s).`);
  await mongoose.disconnect();
}

migrar().catch((error) => {
  console.error("Error en la migración:", error);
  process.exit(1);
});