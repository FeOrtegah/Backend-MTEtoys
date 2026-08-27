// Convierte un texto (ej: nombre de producto) en un slug apto para URL.
// "Camión de Bomberos XL" -> "camion-de-bomberos-xl"
export function slugify(texto) {
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes/acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // quita caracteres especiales
    .replace(/\s+/g, "-") // espacios -> guiones
    .replace(/-+/g, "-") // colapsa guiones repetidos
    .replace(/^-+|-+$/g, ""); // quita guiones al inicio/final
}

// Genera un slug único para un modelo dado, agregando sufijo -2, -3, etc.
// si ya existe otro documento con el mismo slug (excluyendo el propio id al editar).
export async function generarSlugUnico(Model, nombre, idExcluir = null) {
  const base = slugify(nombre) || "producto";
  let slug = base;
  let contador = 2;

  while (true) {
    const query = { slug };
    if (idExcluir) query._id = { $ne: idExcluir };

    const existe = await Model.exists(query);
    if (!existe) return slug;

    slug = `${base}-${contador}`;
    contador++;
  }
}