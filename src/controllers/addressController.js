import Address from "../models/Address.js";

const MAXIMO_DIRECCIONES = 3;

// =====================================================
// MIS DIRECCIONES
// =====================================================

export const getMyAddresses = async (req, res) => {
  try {
    const direcciones = await Address.find({
      usuario: req.usuario.id,
    }).sort({ createdAt: -1 });

    res.json(direcciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// CREAR DIRECCIÓN
// =====================================================

export const createAddress = async (req, res) => {
  try {
    const {
      nombre,
      nombreReceptor,
      telefono,
      direccion,
      numero,
      departamento,
      region,
      comuna,
      indicaciones,
    } = req.body;

    if (
      !nombre ||
      !nombreReceptor ||
      !telefono ||
      !direccion ||
      !numero ||
      !region ||
      !comuna
    ) {
      return res.status(400).json({
        message: "Faltan datos obligatorios de la dirección",
      });
    }

    const totalActual = await Address.countDocuments({
      usuario: req.usuario.id,
    });

    if (totalActual >= MAXIMO_DIRECCIONES) {
      return res.status(400).json({
        message: `Ya tienes el máximo de ${MAXIMO_DIRECCIONES} direcciones guardadas. Elimina una para agregar otra.`,
      });
    }

    const nueva = await Address.create({
      usuario: req.usuario.id,
      nombre,
      nombreReceptor,
      telefono,
      direccion,
      numero,
      departamento: departamento || "",
      region,
      comuna,
      indicaciones: indicaciones || "",
    });

    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// ACTUALIZAR DIRECCIÓN
// =====================================================

export const updateAddress = async (req, res) => {
  try {
    const direccion = await Address.findById(req.params.id);

    if (!direccion) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    if (String(direccion.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const campos = [
      "nombre",
      "nombreReceptor",
      "telefono",
      "direccion",
      "numero",
      "departamento",
      "region",
      "comuna",
      "indicaciones",
    ];

    campos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        direccion[campo] = req.body[campo];
      }
    });

    await direccion.save();

    res.json(direccion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// ELIMINAR DIRECCIÓN
// =====================================================

export const deleteAddress = async (req, res) => {
  try {
    const direccion = await Address.findById(req.params.id);

    if (!direccion) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    if (String(direccion.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    await direccion.deleteOne();

    res.json({ message: "Dirección eliminada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};