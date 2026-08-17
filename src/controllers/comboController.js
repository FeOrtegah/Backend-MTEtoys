import Combo from "../models/Combo.js";

/*
 * Combos activos para la tienda
 */
export const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find({ activo: true })
      .populate("productoPrincipal")
      .populate("productoAdicional");

    res.json(combos);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


/*
 * Todos los combos para administración
 */
export const getAllCombosAdmin = async (req, res) => {
  try {
    const combos = await Combo.find()
      .populate("productoPrincipal")
      .populate("productoAdicional");

    res.json(combos);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


/*
 * Crear combo
 */
export const createCombo = async (req, res) => {
  try {
    const combo = new Combo({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion || "",

      productoPrincipal: req.body.productoPrincipal,
      productoAdicional: req.body.productoAdicional,

      cantidadAdicional:
        Number(req.body.cantidadAdicional) || 1,

      precioCombo:
        Number(req.body.precioCombo),

      precioOferta:
        req.body.precioOferta === "" ||
        req.body.precioOferta === null ||
        req.body.precioOferta === undefined
          ? null
          : Number(req.body.precioOferta),

      enOferta: Boolean(req.body.enOferta),

      destacado: Boolean(req.body.destacado),

      imagenes: Array.isArray(req.body.imagenes)
        ? req.body.imagenes
        : [],

      activo:
        req.body.activo === undefined
          ? true
          : Boolean(req.body.activo),
    });

    const nuevoCombo = await combo.save();

    const populado = await Combo.findById(nuevoCombo._id)
      .populate("productoPrincipal")
      .populate("productoAdicional");

    res.status(201).json(populado);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


/*
 * Editar combo
 */
export const updateCombo = async (req, res) => {
  try {
    const datos = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion || "",

      productoPrincipal: req.body.productoPrincipal,
      productoAdicional: req.body.productoAdicional,

      cantidadAdicional:
        Number(req.body.cantidadAdicional) || 1,

      precioCombo:
        Number(req.body.precioCombo),

      precioOferta:
        req.body.precioOferta === "" ||
        req.body.precioOferta === null ||
        req.body.precioOferta === undefined
          ? null
          : Number(req.body.precioOferta),

      enOferta: Boolean(req.body.enOferta),

      destacado: Boolean(req.body.destacado),

      imagenes: Array.isArray(req.body.imagenes)
        ? req.body.imagenes
        : [],

      activo:
        req.body.activo === undefined
          ? true
          : Boolean(req.body.activo),
    };

    const combo = await Combo.findByIdAndUpdate(
      req.params.id,
      datos,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("productoPrincipal")
      .populate("productoAdicional");

    if (!combo) {
      return res.status(404).json({
        message: "Combo no encontrado",
      });
    }

    res.json(combo);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


/*
 * Desactivar combo
 */
export const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id);

    if (!combo) {
      return res.status(404).json({
        message: "Combo no encontrado",
      });
    }

    res.json({
      message: "Combo eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


/*
 * Activar combo
 */
export const activateCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(
      req.params.id,
      {
        activo: true,
      },
      {
        new: true,
      }
    )
      .populate("productoPrincipal")
      .populate("productoAdicional");

    if (!combo) {
      return res.status(404).json({
        message: "Combo no encontrado",
      });
    }

    res.json(combo);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};