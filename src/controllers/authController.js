import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";


// =====================================================
// UTILIDADES
// =====================================================


// -----------------------------------------------------
// Normalizar email
// -----------------------------------------------------

const normalizarEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};


// -----------------------------------------------------
// Limpiar texto
// -----------------------------------------------------

const limpiarTexto = (valor, max = 300) => {
  if (valor === undefined || valor === null) {
    return "";
  }

  return String(valor)
    .trim()
    .slice(0, max);
};


// -----------------------------------------------------
// Validar email
// -----------------------------------------------------

const emailValido = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};


// -----------------------------------------------------
// Normalizar RUT
// -----------------------------------------------------

const normalizarRut = (rut) => {
  return String(rut || "")
    .trim()
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .toUpperCase();
};


// -----------------------------------------------------
// Validar RUT chileno
// -----------------------------------------------------

const validarRut = (rut) => {
  const rutLimpio = normalizarRut(rut);

  if (!/^\d{7,8}-[\dK]$/.test(rutLimpio)) {
    return false;
  }

  const [cuerpo, dv] = rutLimpio.split("-");

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;

    multiplicador++;

    if (multiplicador > 7) {
      multiplicador = 2;
    }
  }

  const resto = 11 - (suma % 11);

  let dvEsperado;

  if (resto === 11) {
    dvEsperado = "0";
  } else if (resto === 10) {
    dvEsperado = "K";
  } else {
    dvEsperado = String(resto);
  }

  return dv === dvEsperado;
};


// -----------------------------------------------------
// Validar teléfono chileno
// -----------------------------------------------------

const validarTelefono = (telefono) => {
  const limpio = String(telefono || "")
    .replace(/\s/g, "")
    .replace(/-/g, "");

  return /^(\+?56)?9\d{8}$/.test(limpio);
};


// -----------------------------------------------------
// Validar dirección
// -----------------------------------------------------

const validarDatosDireccion = (datos) => {
  const errores = [];

  const etiqueta = limpiarTexto(
    datos.etiqueta,
    50
  );

  const nombreReceptor = limpiarTexto(
    datos.nombreReceptor,
    100
  );

  const rut = normalizarRut(
    datos.rut
  );

  const telefono = limpiarTexto(
    datos.telefono,
    20
  );

  const calle = limpiarTexto(
    datos.calle,
    150
  );

  const numero = limpiarTexto(
    datos.numero,
    20
  );

  const departamento = limpiarTexto(
    datos.departamento,
    50
  );

  const comuna = limpiarTexto(
    datos.comuna,
    100
  );

  const region = limpiarTexto(
    datos.region,
    100
  );

  const indicaciones = limpiarTexto(
    datos.indicaciones,
    300
  );


  if (!etiqueta) {
    errores.push(
      "La etiqueta de la dirección es obligatoria"
    );
  }


  if (!nombreReceptor) {
    errores.push(
      "El nombre del receptor es obligatorio"
    );
  }


  if (!rut || !validarRut(rut)) {
    errores.push(
      "El RUT ingresado no es válido"
    );
  }


  if (
    !telefono ||
    !validarTelefono(telefono)
  ) {
    errores.push(
      "El teléfono ingresado no es válido"
    );
  }


  if (!calle) {
    errores.push(
      "La calle es obligatoria"
    );
  }


  if (!numero) {
    errores.push(
      "El número de dirección es obligatorio"
    );
  }


  if (!region) {
    errores.push(
      "La región es obligatoria"
    );
  }


  if (!comuna) {
    errores.push(
      "La comuna es obligatoria"
    );
  }


  return {
    errores,

    direccion: {
      etiqueta,
      nombreReceptor,
      rut,
      telefono,
      calle,
      numero,
      departamento,
      comuna,
      region,
      indicaciones,
    },
  };
};


// =====================================================
// REGISTRO
// =====================================================

export const register = async (req, res) => {
  try {

    const email =
      normalizarEmail(req.body.email);

    const password =
      String(req.body.password || "");

    const nombre =
      limpiarTexto(req.body.nombre, 100);


    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email y contraseña son obligatorios",
      });
    }


    if (!emailValido(email)) {
      return res.status(400).json({
        message:
          "El correo electrónico no es válido",
      });
    }


    if (password.length < 8) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 8 caracteres",
      });
    }


    const existe =
      await User.findOne({ email });


    if (existe) {
      return res.status(400).json({
        message:
          "Ese usuario ya existe",
      });
    }


    const salt =
      await bcrypt.genSalt(10);


    const passwordHash =
      await bcrypt.hash(
        password,
        salt
      );


    const usuario =
      new User({
        email,
        password: passwordHash,
        rol: "cliente",
        nombre,
      });


    await usuario.save();


    res.status(201).json({
      message:
        "Cuenta creada correctamente",
    });


  } catch (error) {

    console.error(
      "Error registrando usuario:",
      error
    );

    res.status(400).json({
      message:
        "No se pudo crear la cuenta",
    });
  }
};


// =====================================================
// CREAR ADMIN
// =====================================================

export const registerAdmin = async (
  req,
  res
) => {
  try {

    const email =
      normalizarEmail(req.body.email);

    const password =
      String(req.body.password || "");


    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email y contraseña son obligatorios",
      });
    }


    const existe =
      await User.findOne({ email });


    if (existe) {
      return res.status(400).json({
        message:
          "Ese usuario ya existe",
      });
    }


    const salt =
      await bcrypt.genSalt(10);


    const passwordHash =
      await bcrypt.hash(
        password,
        salt
      );


    const usuario =
      new User({
        email,
        password: passwordHash,
        rol: "admin",
      });


    await usuario.save();


    res.status(201).json({
      message:
        "Admin creado correctamente",
    });


  } catch (error) {

    res.status(400).json({
      message:
        "No se pudo crear el administrador",
    });
  }
};


// =====================================================
// BOOTSTRAP ADMIN
// =====================================================

export const bootstrapAdmin = async (
  req,
  res
) => {
  try {

    const yaHayAdmin =
      await User.exists({
        rol: "admin",
      });


    if (yaHayAdmin) {
      return res.status(403).json({
        message:
          "Ya existe un admin, esta ruta está deshabilitada",
      });
    }


    const email =
      normalizarEmail(req.body.email);

    const password =
      String(req.body.password || "");


    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email y contraseña son obligatorios",
      });
    }


    const existe =
      await User.findOne({ email });


    if (existe) {
      return res.status(400).json({
        message:
          "Ese usuario ya existe",
      });
    }


    const salt =
      await bcrypt.genSalt(10);


    const passwordHash =
      await bcrypt.hash(
        password,
        salt
      );


    const usuario =
      new User({
        email,
        password: passwordHash,
        rol: "admin",
      });


    await usuario.save();


    res.status(201).json({
      message:
        "Primer admin creado correctamente",
    });


  } catch (error) {

    res.status(400).json({
      message:
        "No se pudo crear el primer administrador",
    });
  }
};


// =====================================================
// LOGIN
// =====================================================

export const login = async (
  req,
  res
) => {
  try {

    const email =
      normalizarEmail(req.body.email);

    const password =
      String(req.body.password || "");


    const usuario =
      await User.findOne({ email });


    if (!usuario) {
      return res.status(401).json({
        message:
          "Credenciales inválidas",
      });
    }


    const passwordValida =
      await bcrypt.compare(
        password,
        usuario.password
      );


    if (!passwordValida) {
      return res.status(401).json({
        message:
          "Credenciales inválidas",
      });
    }


    const token =
      jwt.sign(
        {
          id: usuario._id,
          email: usuario.email,
          rol: usuario.rol,
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "7d",
        }
      );


    res.json({
      token,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
    });


  } catch (error) {

    console.error(
      "Error en login:",
      error
    );

    res.status(500).json({
      message:
        "Error al iniciar sesión",
    });
  }
};


// =====================================================
// OBTENER MI PERFIL
// =====================================================

export const getMe = async (
  req,
  res
) => {
  try {

    const usuario =
      await User
        .findById(req.usuario.id)
        .select("-password");


    if (!usuario) {
      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }


    res.json(usuario);


  } catch (error) {

    res.status(500).json({
      message:
        "Error al obtener el perfil",
    });
  }
};


// =====================================================
// ACTUALIZAR PERFIL
// =====================================================

export const updateMe = async (
  req,
  res
) => {
  try {

    const nombre =
      limpiarTexto(
        req.body.nombre,
        100
      );

    const telefono =
      limpiarTexto(
        req.body.telefono,
        20
      );


    if (telefono && !validarTelefono(telefono)) {
      return res.status(400).json({
        message:
          "El teléfono no es válido",
      });
    }


    const usuario =
      await User.findByIdAndUpdate(
        req.usuario.id,

        {
          nombre,
          telefono,
        },

        {
          new: true,
          runValidators: true,
        }
      ).select("-password");


    if (!usuario) {
      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }


    res.json(usuario);


  } catch (error) {

    console.error(
      "Error actualizando perfil:",
      error
    );

    res.status(400).json({
      message:
        "No se pudo actualizar el perfil",
    });
  }
};


// =====================================================
// OBTENER DIRECCIONES
// =====================================================

export const getAddresses = async (
  req,
  res
) => {
  try {

    const usuario =
      await User.findById(
        req.usuario.id
      ).select(
        "direcciones"
      );


    if (!usuario) {
      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }


    res.json(
      usuario.direcciones || []
    );


  } catch (error) {

    console.error(
      "Error obteniendo direcciones:",
      error
    );

    res.status(500).json({
      message:
        "Error al obtener las direcciones",
    });
  }
};


// =====================================================
// AGREGAR DIRECCIÓN
// =====================================================

export const addAddress = async (
  req,
  res
) => {
  try {

    const {
      errores,
      direccion,
    } = validarDatosDireccion(
      req.body
    );


    if (errores.length > 0) {
      return res.status(400).json({
        message:
          "Datos de dirección inválidos",
        errors: errores,
      });
    }


    const usuario =
      await User.findById(
        req.usuario.id
      );


    if (!usuario) {
      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }


    const primeraDireccion =
      usuario.direcciones.length === 0;


    if (
      primeraDireccion ||
      direccion.predeterminada === true
    ) {

      usuario.direcciones.forEach(
        (item) => {
          item.predeterminada = false;
        }
      );

      direccion.predeterminada =
        true;
    }


    usuario.direcciones.push(
      direccion
    );


    await usuario.save();


    res.status(201).json({
      message:
        "Dirección agregada correctamente",
      direcciones:
        usuario.direcciones,
    });


  } catch (error) {

    console.error(
      "Error agregando dirección:",
      error
    );

    res.status(400).json({
      message:
        "No se pudo agregar la dirección",
    });
  }
};


// =====================================================
// EDITAR DIRECCIÓN
// =====================================================

export const updateAddress = async (
  req,
  res
) => {
  try {

    const {
      id,
    } = req.params;


    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "ID de dirección inválido",
      });
    }


    const {
      errores,
      direccion,
    } = validarDatosDireccion(
      req.body
    );


    if (errores.length > 0) {
      return res.status(400).json({
        message:
          "Datos de dirección inválidos",
        errors: errores,
      });
    }


    const usuario =
      await User.findById(
        req.usuario.id
      );


    if (!usuario) {
      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }


    const direccionExistente =
      usuario.direcciones.id(id);


    if (!direccionExistente) {
      return res.status(404).json({
        message:
          "Dirección no encontrada",
      });
    }


    const eraPredeterminada =
      direccionExistente.predeterminada;


    Object.assign(
      direccionExistente,
      direccion
    );


    if (
      eraPredeterminada
    ) {
      direccionExistente.predeterminada =
        true;
    }


    await usuario.save();


    res.json({
      message:
        "Dirección actualizada correctamente",
      direcciones:
        usuario.direcciones,
    });


  } catch (error) {

    console.error(
      "Error actualizando dirección:",
      error
    );

    res.status(400).json({
      message:
        "No se pudo actualizar la dirección",
    });
  }
};


// =====================================================
// ELIMINAR DIRECCIÓN
// =====================================================

export const deleteAddress = async (
  req,
  res
) => {
  try {

    const {
      id,
    } = req.params;


    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "ID de dirección inválido",
      });
    }


    const usuario =
      await User.findById(
        req.usuario.id
      );


    if (!usuario) {
      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }


    const direccion =
      usuario.direcciones.id(id);


    if (!direccion) {
      return res.status(404).json({
        message:
          "Dirección no encontrada",
      });
    }


    const eraPredeterminada =
      direccion.predeterminada;


    direccion.deleteOne();


    // -----------------------------------------------
    // Si eliminamos la predeterminada,
    // seleccionar otra automáticamente.
    // -----------------------------------------------

    if (
      eraPredeterminada &&
      usuario.direcciones.length > 0
    ) {

      usuario.direcciones[0]
        .predeterminada = true;
    }


    await usuario.save();


    res.json({
      message:
        "Dirección eliminada correctamente",
      direcciones:
        usuario.direcciones,
    });


  } catch (error) {

    console.error(
      "Error eliminando dirección:",
      error
    );

    res.status(400).json({
      message:
        "No se pudo eliminar la dirección",
    });
  }
};


// =====================================================
// MARCAR COMO PREDETERMINADA
// =====================================================

export const setDefaultAddress = async (
  req,
  res
) => {
  try {

    const {
      id,
    } = req.params;


    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "ID de dirección inválido",
      });
    }


    const usuario =
      await User.findById(
        req.usuario.id
      );


    if (!usuario) {
      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }


    const direccion =
      usuario.direcciones.id(id);


    if (!direccion) {
      return res.status(404).json({
        message:
          "Dirección no encontrada",
      });
    }


    usuario.direcciones.forEach(
      (item) => {
        item.predeterminada = false;
      }
    );


    direccion.predeterminada =
      true;


    await usuario.save();


    res.json({
      message:
        "Dirección predeterminada actualizada",
      direcciones:
        usuario.direcciones,
    });


  } catch (error) {

    console.error(
      "Error cambiando dirección predeterminada:",
      error
    );

    res.status(400).json({
      message:
        "No se pudo cambiar la dirección predeterminada",
    });
  }
};