import Product from "../models/Product.js";
import Combo from "../models/Combo.js";

// URL pública del frontend (donde vive el sitio, no la API)
const SITE_URL = process.env.SITE_URL || "https://mtetoys.cl";

// Páginas estáticas del sitio, con prioridad/frecuencia razonables para SEO
const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/productos", priority: "0.9", changefreq: "daily" },
  { path: "/marcas", priority: "0.8", changefreq: "weekly" },
  { path: "/politicas-envio", priority: "0.3", changefreq: "monthly" },
  { path: "/medios-de-pago", priority: "0.3", changefreq: "monthly" },
  { path: "/pago-transferencia", priority: "0.3", changefreq: "monthly" },
  { path: "/politicas-cambio", priority: "0.3", changefreq: "monthly" },
  { path: "/contacto", priority: "0.4", changefreq: "monthly" },
];

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(date) {
  return (date ? new Date(date) : new Date()).toISOString().split("T")[0];
}

function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// GET /sitemap.xml
// Genera el sitemap en vivo: páginas estáticas + una URL por cada
// categoría (marca) + una URL por cada producto y combo activo.
// No requiere caché ni cron: al ser barato de calcular, se arma
// en cada request con los datos actuales de Mongo.
export const getSitemap = async (req, res) => {
  try {
    const today = toIsoDate();
    const entries = [];

    for (const page of STATIC_PAGES) {
      entries.push(
        buildUrlEntry({
          loc: `${SITE_URL}${page.path}`,
          lastmod: today,
          changefreq: page.changefreq,
          priority: page.priority,
        })
      );
    }

    const [productos, combos] = await Promise.all([
      Product.find({ activo: true }).select("slug categoria updatedAt").lean(),
      Combo.find({ activo: true }).select("updatedAt").lean(),
    ]);

    // Categorías (marcas) únicas -> /productos?categoria=NOMBRE
    const categorias = new Set();
    for (const p of productos) {
      if (p.categoria) categorias.add(p.categoria);
    }
    for (const categoria of categorias) {
      entries.push(
        buildUrlEntry({
          loc: `${SITE_URL}/productos?categoria=${encodeURIComponent(categoria)}`,
          lastmod: today,
          changefreq: "weekly",
          priority: "0.7",
        })
      );
    }

    // Productos individuales -> /producto/:slug?tipo=producto
    for (const p of productos) {
      const ident = p.slug || p._id;
      entries.push(
        buildUrlEntry({
          loc: `${SITE_URL}/producto/${ident}?tipo=producto`,
          lastmod: toIsoDate(p.updatedAt),
          changefreq: "weekly",
          priority: "0.6",
        })
      );
    }

    // Combos -> /producto/:id?tipo=combo (el modelo Combo no tiene slug)
    for (const c of combos) {
      entries.push(
        buildUrlEntry({
          loc: `${SITE_URL}/producto/${c._id}?tipo=combo`,
          lastmod: toIsoDate(c.updatedAt),
          changefreq: "weekly",
          priority: "0.6",
        })
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};