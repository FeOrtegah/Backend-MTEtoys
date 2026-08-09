import Combo from "../models/Combo.js";

export const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find({ activo: true })
      .populate("productoPrincipal")
      .populate("productoAdicional");
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCombosAdmin = async (req, res) => {
  try {
    const combos = await Combo.find()
      .populate("productoPrincipal")
      .populate("productoAdicional");
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCombo = async (req, res) => {
  try {
    const combo = new Combo(req.body);
    const nuevoCombo = await combo.save();
    const populado = await nuevoCombo.populate(["productoPrincipal", "productoAdicional"]);
    res.status(201).json(populado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(["productoPrincipal", "productoAdicional"]);
    if (!combo) return res.status(404).json({ message: "Combo no encontrado" });
    res.json(combo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
    if (!combo) return res.status(404).json({ message: "Combo no encontrado" });
    res.json({ message: "Combo desactivado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};