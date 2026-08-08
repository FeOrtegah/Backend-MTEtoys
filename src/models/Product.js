/**
 * Genera el JSON para POST /api/products/bulk a partir de tus carpetas
 * de Cloudinary (una carpeta por producto, con varias imágenes cada una).
 *
 * USO:
 * 1. npm install cloudinary dotenv
 * 2. Crea un archivo .env (en la misma carpeta que este script) con:
 *      CLOUDINARY_CLOUD_NAME=tu_cloud_name
 *      CLOUDINARY_API_KEY=tu_api_key
 *      CLOUDINARY_API_SECRET=tu_api_secret
 *    Asegúrate de que ese .env esté en tu .gitignore.
 * 3. Completa la lista PRODUCTOS con nombre/precio/categoría/stock de
 *    cada producto, usando el mismo nombre de carpeta que en Cloudinary.
 * 4. node generar-productos.js
 * 5. Copia el JSON que imprime y pégalo en el body de Thunder Client.
 */

import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Completa con tus productos reales. "carpeta" = nombre exacto de la
// carpeta en Cloudinary donde están sus 4 imágenes.
const PRODUCTOS = [
  {
    carpeta: "peluche-dinosaurio",
    nombre: "Peluche Dinosaurio",
    descripcion: "Peluche suave tamaño mediano",
    precio: 19990,
    categoria: "Peluches",
    stock: 10,
  },
  {
    carpeta: "auto-deportivo",
    nombre: "Auto Deportivo",
    descripcion: "Auto a escala con detalles realistas",
    precio: 29990,
    categoria: "Vehículos",
    stock: 5,
  },
  // ...agrega el resto de tus productos aquí
];

async function obtenerImagenes(carpeta) {
  const resultado = await cloudinary.api.resources({
    type: "upload",
    prefix: `${carpeta}/`,
    max_results: 20,
  });

  return resultado.resources.map((r) => r.secure_url);
}

async function main() {
  const productos = [];

  for (const p of PRODUCTOS) {
    console.error(`Buscando imágenes en carpeta: ${p.carpeta}...`);

    const imagenes = await obtenerImagenes(p.carpeta);

    if (imagenes.length === 0) {
      console.error(`  ⚠️  No se encontraron imágenes en "${p.carpeta}"`);
    }

    productos.push({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      categoria: p.categoria,
      imagenes,
      stock: p.stock,
    });
  }

  console.log(JSON.stringify({ productos }, null, 2));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});