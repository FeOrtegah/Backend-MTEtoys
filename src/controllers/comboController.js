import Combo from "../models/Combo.js";

// ========================================
// OBTENER COMBOS ACTIVOS - TIENDA
// ========================================

export const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find({
      activo: true,
    })
      .populate("productoPrincipal")
      .populate("productoAdicional");

    res.json(combos);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ========================================
// OBTENER TODOS LOS COMBOS - ADMIN
// ========================================

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

// ========================================
// CREAR COMBO
// ========================================

export const createCombo = async (req, res) => {
  try {
    const combo = new Combo({
      nombre: req.body.nombre,

      descripcion:
        req.body.descripcion || "",

      productoPrincipal:
        req.body.productoPrincipal,

      productoAdicional:
        req.body.productoAdicional,

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

      enOferta:
        Boolean(req.body.enOferta),

      destacado:
        Boolean(req.body.destacado),

      imagenes:
        Array.isArray(req.body.imagenes)
          ? req.body.imagenes
          : [],

      activo:
        req.body.activo === undefined
          ? true
          : Boolean(req.body.activo),
    });

    const nuevoCombo =
      await combo.save();

    const populado =
      await Combo.findById(
        nuevoCombo._id
      )
        .populate("productoPrincipal")
        .populate("productoAdicional");

    res.status(201).json(populado);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// ========================================
// EDITAR COMBO
// ========================================

export const updateCombo = async (req, res) => {
  try {
    const datos = {
      nombre:
        req.body.nombre,

      descripcion:
        req.body.descripcion || "",

      productoPrincipal:
        req.body.productoPrincipal,

      productoAdicional:
        req.body.productoAdicional,

      cantidadAdicional:
        Number(
          req.body.cantidadAdicional
        ) || 1,

      precioCombo:
        Number(
          req.body.precioCombo
        ),

      precioOferta:
        req.body.precioOferta === "" ||
        req.body.precioOferta === null ||
        req.body.precioOferta === undefined
          ? null
          : Number(
              req.body.precioOferta
            ),

      enOferta:
        Boolean(
          req.body.enOferta
        ),

      destacado:
        Boolean(
          req.body.destacado
        ),

      imagenes:
        Array.isArray(
          req.body.imagenes
        )
          ? req.body.imagenes
          : [],

      activo:
        req.body.activo === undefined
          ? true
          : Boolean(
              req.body.activo
            ),
    };

    const combo =
      await Combo.findByIdAndUpdate(
        req.params.id,
        datos,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "productoPrincipal"
        )
        .populate(
          "productoAdicional"
        );

    if (!combo) {
      return res.status(404).json({
        message:
          "Combo no encontrado",
      });
    }

    res.json(combo);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// ========================================
// DESACTIVAR COMBO
// ========================================

export const deleteCombo = async (req, res) => {
  try {
    const combo =
      await Combo.findByIdAndUpdate(
        req.params.id,
        {
          activo: false,
        },
        {
          new: true,
        }
      )
        .populate(
          "productoPrincipal"
        )
        .populate(
          "productoAdicional"
        );

    if (!combo) {
      return res.status(404).json({
        message:
          "Combo no encontrado",
      });
    }

    res.json({
      message:
        "Combo desactivado correctamente",
      combo,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ========================================
// ACTIVAR COMBO
// ========================================

export const activateCombo = async (req, res) => {
  try {
    const combo =
      await Combo.findByIdAndUpdate(
        req.params.id,
        {
          activo: true,
        },
        {
          new: true,
        }
      )
        .populate(
          "productoPrincipal"
        )
        .populate(
          "productoAdicional"
        );

    if (!combo) {
      return res.status(404).json({
        message:
          "Combo no encontrado",
      });
    }

    res.json(combo);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ========================================
// ELIMINAR COMBO PERMANENTEMENTE
// ========================================

export const hardDeleteCombo = async (req, res) => {
  try {
    const combo =
      await Combo.findByIdAndDelete(
        req.params.id
      );

    if (!combo) {
      return res.status(404).json({
        message:
          "Combo no encontrado",
      });
    }

    res.json({
      message:
        "Combo eliminado permanentemente",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};