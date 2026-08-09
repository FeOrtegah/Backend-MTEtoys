import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Registro público — lo usan los clientes de la tienda. Siempre crea rol "cliente".
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: "Ese usuario ya existe" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const usuario = new User({ email, password: passwordHash, rol: "cliente" });
    await usuario.save();

    res.status(201).json({ message: "Cuenta creada correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Crear un admin — requiere estar logueado como admin (ver ruta protegida).
export const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: "Ese usuario ya existe" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const usuario = new User({ email, password: passwordHash, rol: "admin" });
    await usuario.save();

    res.status(201).json({ message: "Admin creado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Crea el PRIMER admin, sin necesitar estar logueado.
// Se autobloquea: si ya existe cualquier admin en la base, rechaza la petición.
export const bootstrapAdmin = async (req, res) => {
  try {
    const yaHayAdmin = await User.exists({ rol: "admin" });
    if (yaHayAdmin) {
      return res.status(403).json({ message: "Ya existe un admin, esta ruta está deshabilitada" });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios" });
    }

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: "Ese usuario ya existe" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const usuario = new User({ email, password: passwordHash, rol: "admin" });
    await usuario.save();

    res.status(201).json({ message: "Primer admin creado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login — sirve para admin y cliente. Devuelve token JWT + rol.
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, email: usuario.email, rol: usuario.rol });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};