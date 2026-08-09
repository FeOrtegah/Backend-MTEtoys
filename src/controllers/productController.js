import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
  try {
    const productos = await Product.find({ activo: true });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Para el panel de admin: incluye inactivos y sin stock
export const getAllProductsAdmin = async (req, res) => {
  try {
    const productos = await Product.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear varios productos de una vez (carga masiva)
export const bulkCreateProducts = async (req, res) => {
  try {
    const { productos } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: "Debes enviar un array de productos" });
    }

    const creados = await Product.insertMany(productos, { ordered: false });
    res.status(201).json({
      message: `${creados.length} productos creados correctamente`,
      productos: creados,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const producto = new Product(req.body);
    const nuevoProducto = await producto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const producto = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const producto = await Product.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto desactivado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const decreaseStock = async (req, res) => {
  try {
    const { cantidad } = req.body;
    const producto = await Product.findById(req.params.id);
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
    if (producto.stock < cantidad) return res.status(400).json({ message: "Stock insuficiente" });

    producto.stock -= cantidad;
    await producto.save();
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};