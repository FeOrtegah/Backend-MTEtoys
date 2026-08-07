import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Registrar el primer (y único) admin — usar una sola vez y luego deshabilitar la ruta
export const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: "Ese usuario ya existe" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const usuario = new User({ email, password: passwordHash });
    await usuario.save();

    res.status(201).json({ message: "Admin creado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login — devuelve un token JWT
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

    res.json({ token, email: usuario.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};  