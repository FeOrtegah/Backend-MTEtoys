import SiteContent from "../models/SiteContent.js";

// =====================================================
// OBTENER CONTENIDO DE UNA SECCIÓN (PÚBLICO)
// =====================================================
// GET /api/site-content/:seccion
// Devuelve la lista ordenada. Si está vacía, el frontend
// usa su contenido por defecto (no rompe la página).

export const getContentBySection = async (req, res) => {
  try {
    const { seccion } = req.params;

    const items = await SiteContent.find({ seccion }).sort({
      orden: 1,
      createdAt: 1,
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// CREAR ITEM DE CONTENIDO (SOLO ADMIN)
// =====================================================

export const createContent = async (req, res) => {
  try {
    const {
      seccion,
      imagen,
      titulo,
      subtitulo,
      link,
      orden,
      edadMinima,
      edadMaxima,
      forma,
    } = req.body;

    if (!seccion) {
      return res.status(400).json({ message: "Falta seccion" });
    }

    // Todas las secciones necesitan imagen, excepto las
    // tarjetas de "Regalos por edad" (son figuras de color).
    if (seccion !== "ageGiftCard" && !imagen) {
      return res.status(400).json({ message: "Falta imagen" });
    }

    const nuevo = await SiteContent.create({
      seccion,
      imagen: imagen || "",
      titulo: titulo || "",
      subtitulo: subtitulo || "",
      link: link || "",
      orden: orden ?? 0,
      edadMinima: edadMinima ?? null,
      edadMaxima: edadMaxima ?? null,
      forma: forma || "",
    });

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// ACTUALIZAR ITEM DE CONTENIDO (SOLO ADMIN)
// =====================================================

export const updateContent = async (req, res) => {
  try {
    const {
      imagen,
      titulo,
      subtitulo,
      link,
      orden,
      edadMinima,
      edadMaxima,
      forma,
    } = req.body;

    const item = await SiteContent.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Contenido no encontrado" });
    }

    if (imagen !== undefined) item.imagen = imagen;
    if (titulo !== undefined) item.titulo = titulo;
    if (subtitulo !== undefined) item.subtitulo = subtitulo;
    if (link !== undefined) item.link = link;
    if (orden !== undefined) item.orden = orden;
    if (edadMinima !== undefined) item.edadMinima = edadMinima;
    if (edadMaxima !== undefined) item.edadMaxima = edadMaxima;
    if (forma !== undefined) item.forma = forma;

    await item.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// ELIMINAR ITEM DE CONTENIDO (SOLO ADMIN)
// =====================================================

export const deleteContent = async (req, res) => {
  try {
    const item = await SiteContent.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Contenido no encontrado" });
    }

    res.json({ message: "Eliminado", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};