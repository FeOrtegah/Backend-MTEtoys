import mongoose from "mongoose";
import Cupon from "../models/Cupon.js";
import CuponUso from "../models/CuponUso.js";
import {
  CuponError,
  previsualizarCupon,
  normalizarCodigo,
  emailCanonico,
  generarCodigoAleatorio,
} from "../utils/cupones.js";

// =====================================================
// UTILIDADES
// =====================================================

const responderError = (res, error, mensajeGenerico) => {
  if (error instanceof CuponError) {
    return res.status(error.status).json({ message: error.message });
  }

  console.error(mensajeGenerico, error);
  return res.status(500).json({ message: mensajeGenerico });
};

// Valida los campos comunes y devuelve { datos } o { error }
const leerCamposCupon = (body) => {
  const tipo = body.tipo;
  const valor = Number(body.valor);

  if (!["porcentaje", "monto"].includes(tipo)) {
    return { error: "Tipo de descuento inválido" };
  }

  if (!Number.isFinite(valor) || valor < 1) {
    return { error: "El valor del descuento debe ser mayor a 0" };
  }

  if (tipo === "porcentaje" && valor > 90) {
    return { error: "El porcentaje no puede superar 90%" };
  }

  if (tipo === "monto" && !Number.isInteger(valor)) {
    return { error: "El monto debe ser un número entero en pesos" };
  }

  const montoMinimo = Math.max(0, Math.round(Number(body.montoMinimo) || 0));

  const fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
  const fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;

  if (
    (fechaInicio && Number.isNaN(fechaInicio.getTime())) ||
    (fechaFin && Number.isNaN(fechaFin.getTime()))
  ) {
    return { error: "Fechas inválidas" };
  }

  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    return { error: "La fecha de término no puede ser anterior a la de inicio" };
  }

  return {
    datos: {
      tipo,
      valor,
      montoMinimo,
      fechaInicio,
      fechaFin,
      descripcion: String(body.descripcion || "").trim().slice(0, 120),
    },
  };
};

// =====================================================
// VALIDAR CUPÓN (PÚBLICO, con rate limit en la ruta)
// =====================================================
// No gasta el cupón: solo informa el descuento. El canje
// real y definitivo ocurre al crear el pedido.

export const validarCupon = async (req, res) => {
  try {
    const { codigo, subtotal, cliente } = req.body;

    const { cupon, descuento } = await previsualizarCupon({
      codigo,
      subtotal: Number(subtotal) || 0,
      cliente: cliente || {},
    });

    return res.json({
      valido: true,
      codigo: cupon.codigo,
      descripcion: cupon.descripcion,
      tipo: cupon.tipo,
      valor: cupon.valor,
      descuento,
    });
  } catch (error) {
    return responderError(res, error, "Error al validar el cupón");
  }
};

// =====================================================
// ADMIN: LISTAR
// =====================================================

export const listarCupones = async (req, res) => {
  try {
    const cupones = await Cupon.find().sort({ createdAt: -1 }).limit(1000);
    return res.json(cupones);
  } catch (error) {
    return responderError(res, error, "Error al obtener los cupones");
  }
};

// =====================================================
// ADMIN: CREAR UN CÓDIGO (genérico o con código elegido)
// =====================================================

export const crearCupon = async (req, res) => {
  try {
    const campos = leerCamposCupon(req.body);
    if (campos.error) return res.status(400).json({ message: campos.error });

    const codigo = normalizarCodigo(req.body.codigo);

    if (codigo.length < 4) {
      return res.status(400).json({ message: "El código debe tener al menos 4 letras o números" });
    }

    let usosMaximos = null;

    if (req.body.usosMaximos !== undefined && req.body.usosMaximos !== "" && req.body.usosMaximos !== null) {
      usosMaximos = Math.round(Number(req.body.usosMaximos));
      if (!Number.isFinite(usosMaximos) || usosMaximos < 1) {
        return res.status(400).json({ message: "El máximo de usos debe ser al menos 1" });
      }
    }

    const emailAsignado = req.body.emailAsignado
      ? emailCanonico(req.body.emailAsignado)
      : "";

    const nuevo = await Cupon.create({
      ...campos.datos,
      codigo,
      campania: normalizarCodigo(req.body.campania) || codigo,
      usosMaximos,
      emailAsignado,
    });

    return res.status(201).json(nuevo);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Ya existe un cupón con ese código" });
    }
    return responderError(res, error, "Error al crear el cupón");
  }
};

// =====================================================
// ADMIN: GENERAR LOTE DE CÓDIGOS ÚNICOS (1 uso c/u)
// =====================================================

export const crearLote = async (req, res) => {
  try {
    const campos = leerCamposCupon(req.body);
    if (campos.error) return res.status(400).json({ message: campos.error });

    const cantidad = Math.round(Number(req.body.cantidad));

    if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > 500) {
      return res.status(400).json({ message: "La cantidad debe estar entre 1 y 500" });
    }

    const prefijo = normalizarCodigo(req.body.prefijo).slice(0, 10);
    const campania = normalizarCodigo(req.body.campania) || prefijo || `LOTE${Date.now()}`;

    const creados = [];
    let intentos = 0;

    // Los códigos son aleatorios; ante una colisión (muy
    // improbable) simplemente se genera otro.
    while (creados.length < cantidad && intentos < cantidad * 5) {
      intentos += 1;

      try {
        const nuevo = await Cupon.create({
          ...campos.datos,
          codigo: generarCodigoAleatorio(prefijo, 8),
          campania,
          usosMaximos: 1,
        });

        creados.push(nuevo);
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }

    return res.status(201).json({
      campania,
      cantidad: creados.length,
      codigos: creados.map((c) => c.codigo),
    });
  } catch (error) {
    return responderError(res, error, "Error al generar el lote de cupones");
  }
};

// =====================================================
// ADMIN: ACTUALIZAR
// =====================================================

export const actualizarCupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const cupon = await Cupon.findById(id);
    if (!cupon) return res.status(404).json({ message: "Cupón no encontrado" });

    if (req.body.activo !== undefined) cupon.activo = Boolean(req.body.activo);

    if (req.body.descripcion !== undefined) {
      cupon.descripcion = String(req.body.descripcion).trim().slice(0, 120);
    }

    // Si vienen campos de descuento, se validan en conjunto
    if (
      req.body.tipo !== undefined ||
      req.body.valor !== undefined ||
      req.body.montoMinimo !== undefined ||
      req.body.fechaInicio !== undefined ||
      req.body.fechaFin !== undefined
    ) {
      const campos = leerCamposCupon({
        tipo: req.body.tipo ?? cupon.tipo,
        valor: req.body.valor ?? cupon.valor,
        montoMinimo: req.body.montoMinimo ?? cupon.montoMinimo,
        fechaInicio: req.body.fechaInicio !== undefined ? req.body.fechaInicio : cupon.fechaInicio,
        fechaFin: req.body.fechaFin !== undefined ? req.body.fechaFin : cupon.fechaFin,
        descripcion: cupon.descripcion,
      });

      if (campos.error) return res.status(400).json({ message: campos.error });

      cupon.tipo = campos.datos.tipo;
      cupon.valor = campos.datos.valor;
      cupon.montoMinimo = campos.datos.montoMinimo;
      cupon.fechaInicio = campos.datos.fechaInicio;
      cupon.fechaFin = campos.datos.fechaFin;
    }

    if (req.body.usosMaximos !== undefined) {
      if (req.body.usosMaximos === null || req.body.usosMaximos === "") {
        cupon.usosMaximos = null;
      } else {
        const max = Math.round(Number(req.body.usosMaximos));
        if (!Number.isFinite(max) || max < 1) {
          return res.status(400).json({ message: "El máximo de usos debe ser al menos 1" });
        }
        cupon.usosMaximos = max;
      }
    }

    await cupon.save();
    return res.json(cupon);
  } catch (error) {
    return responderError(res, error, "Error al actualizar el cupón");
  }
};

// =====================================================
// ADMIN: ELIMINAR (solo si nunca se usó)
// =====================================================

export const eliminarCupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const cupon = await Cupon.findById(id);
    if (!cupon) return res.status(404).json({ message: "Cupón no encontrado" });

    const tieneUsos = cupon.usosActuales > 0 || (await CuponUso.exists({ cupon: cupon._id }));

    if (tieneUsos) {
      return res.status(409).json({
        message: "Este cupón ya tiene usos registrados. Desactívalo en vez de eliminarlo.",
      });
    }

    await cupon.deleteOne();
    return res.json({ message: "Eliminado", id });
  } catch (error) {
    return responderError(res, error, "Error al eliminar el cupón");
  }
};

// =====================================================
// ADMIN: QUIÉN USÓ UN CUPÓN
// =====================================================

export const usosDeCupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const usos = await CuponUso.find({ cupon: id })
      .select("pedido email estado descuento createdAt")
      .sort({ createdAt: -1 })
      .limit(500);

    return res.json(usos);
  } catch (error) {
    return responderError(res, error, "Error al obtener los usos del cupón");
  }
};
