import Etiqueta from "../models/Etiqueta.js";

// =====================================================
// LISTAR TODAS LAS ETIQUETAS (PÚBLICO)
// =====================================================
// Se devuelven todas (pasadas, vigentes y futuras) y el
// frontend calcula cuál mostrar según la fecha de hoy,
// igual que el resto de los filtros del sitio.

export const getEtiquetas = async (req, res) => {
  try {
    const etiquetas = await Etiqueta.find().sort({
      fechaInicio: 1,
    });

    res.json(etiquetas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// CREAR ETIQUETA (SOLO ADMIN)
// =====================================================

export const createEtiqueta = async (req, res) => {
  try {
    const {
      texto,
      color,
      colorTexto,
      fechaInicio,
      fechaFin,
      activa,
    } = req.body;

    if (!texto || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        message: "Faltan datos: texto, fechaInicio y fechaFin son obligatorios",
      });
    }

    const nueva = await Etiqueta.create({
      texto,
      color: color || "#E94F37",
      colorTexto: colorTexto || "#FFFFFF",
      fechaInicio,
      fechaFin,
      activa: activa ?? true,
    });

    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// ACTUALIZAR ETIQUETA (SOLO ADMIN)
// =====================================================

export const updateEtiqueta = async (req, res) => {
  try {
    const {
      texto,
      color,
      colorTexto,
      fechaInicio,
      fechaFin,
      activa,
    } = req.body;

    const etiqueta = await Etiqueta.findById(req.params.id);

    if (!etiqueta) {
      return res.status(404).json({ message: "Etiqueta no encontrada" });
    }

    if (texto !== undefined) etiqueta.texto = texto;
    if (color !== undefined) etiqueta.color = color;
    if (colorTexto !== undefined) etiqueta.colorTexto = colorTexto;
    if (fechaInicio !== undefined) etiqueta.fechaInicio = fechaInicio;
    if (fechaFin !== undefined) etiqueta.fechaFin = fechaFin;
    if (activa !== undefined) etiqueta.activa = activa;

    await etiqueta.save();

    res.json(etiqueta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// ELIMINAR ETIQUETA (SOLO ADMIN)
// =====================================================

export const deleteEtiqueta = async (req, res) => {
  try {
    const etiqueta = await Etiqueta.findByIdAndDelete(req.params.id);

    if (!etiqueta) {
      return res.status(404).json({ message: "Etiqueta no encontrada" });
    }

    res.json({ message: "Eliminada", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
