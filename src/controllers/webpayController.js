import mongoose from "mongoose";
import crypto from "crypto";
import { webpayTransaction, logDebug } from "../config/webpay.js";
import { enviarCorreoConfirmacionCompra } from "../config/email.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// =====================================================
// INICIAR TRANSACCIÓN WEBPAY
// =====================================================

export const initTransaction = async (req, res) => {
  try {
    const { orderId, accessToken } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "Falta orderId",
      });
    }

    if (!accessToken || typeof accessToken !== "string") {
      return res.status(400).json({
        message: "Falta accessToken",
      });
    }

    // Validar que el ID sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "orderId inválido",
      });
    }

    // accessToken tiene select:false, hay que pedirlo explícitamente
    const pedido = await Order.findById(orderId).select("+accessToken");

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido no encontrado",
      });
    }

    // Comparación en tiempo constante para evitar timing attacks
    const tokenValido =
      typeof pedido.accessToken === "string" &&
      pedido.accessToken.length === accessToken.length &&
      crypto.timingSafeEqual(
        Buffer.from(pedido.accessToken),
        Buffer.from(accessToken)
      );

    if (!tokenValido) {
      return res.status(403).json({
        message: "No autorizado para este pedido",
      });
    }

    // Solo se puede iniciar Webpay para pedidos pendientes
    if (pedido.estado !== "pendiente") {
      return res.status(400).json({
        message: "Este pedido ya fue procesado",
      });
    }

    const buyOrder = pedido._id.toString();
    const sessionId = pedido._id.toString();

    // El monto SIEMPRE sale del pedido guardado en MongoDB
    const amount = Math.round(pedido.total);

    if (amount <= 0) {
      return res.status(400).json({
        message: "El monto del pedido no es válido",
      });
    }

    const returnUrl = `${process.env.BACKEND_URL}/api/webpay/confirm`;

    const response = await webpayTransaction.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );

    logDebug(
      `TOKEN CREADO: token="${response.token}" buyOrder="${buyOrder}" amount=${amount} url="${response.url}"`
    );

    return res.json({
      url: response.url,
      token: response.token,
    });

  } catch (error) {
    console.error("Error iniciando Webpay:", error);

    logDebug(
      `ERROR en initTransaction: message="${error?.message}" name="${error?.name}" ` +
        `response.status=${error?.response?.status} ` +
        `response.data=${JSON.stringify(error?.response?.data)} ` +
        `stack=${error?.stack?.split("\n").slice(0, 3).join(" | ")}`
    );

    return res.status(500).json({
      message: "Error al iniciar el pago",
    });
  }
};


// =====================================================
// CONFIRMAR TRANSACCIÓN WEBPAY
// =====================================================

export const confirmTransaction = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const params = {
    ...req.query,
    ...req.body,
  };

  const token = params.token_ws;

  const tokenAbortado = params.TBK_TOKEN;

  const ordenCompraAbortada =
    params.TBK_ORDEN_COMPRA;


  // ===================================================
  // CLIENTE CANCELÓ EL PAGO
  // ===================================================

  if (!token && tokenAbortado) {

    logDebug(
      `PAGO ANULADO POR EL USUARIO: TBK_TOKEN="${tokenAbortado}" TBK_ORDEN_COMPRA="${ordenCompraAbortada}"`
    );

    try {

      if (
        ordenCompraAbortada &&
        mongoose.Types.ObjectId.isValid(ordenCompraAbortada)
      ) {

        const pedido = await Order.findById(
          ordenCompraAbortada
        );

        // Solamente cancelamos si todavía está pendiente
        if (
          pedido &&
          pedido.estado === "pendiente"
        ) {
          pedido.estado = "cancelado";

          await pedido.save();
        }
      }

    } catch (error) {

      console.error(
        "Error cancelando pedido:",
        error
      );
    }

    return res.redirect(
      `${frontendUrl}/pago-resultado?estado=cancelado`
    );
  }


  // ===================================================
  // NO HAY TOKEN
  // ===================================================

  if (!token) {

    return res.redirect(
      `${frontendUrl}/pago-resultado?estado=error`
    );
  }


  try {

    // =================================================
    // CONFIRMAR CON TRANSBANK
    // =================================================

    const response =
      await webpayTransaction.commit(token);

    console.log(
      "Respuesta Webpay:",
      response
    );

    logDebug(
      `TOKEN CONFIRMADO: token="${token}" status="${response.status}" response_code=${response.response_code} amount=${response.amount} buy_order="${response.buy_order}" authorization_code="${response.authorization_code}"`
    );


    // =================================================
    // OBTENER PEDIDO
    // =================================================

    const buyOrder = response.buy_order;

    if (!buyOrder) {

      console.error(
        "Webpay no devolvió buy_order"
      );

      return res.redirect(
        `${frontendUrl}/pago-resultado?estado=error`
      );
    }


    if (!mongoose.Types.ObjectId.isValid(buyOrder)) {

      console.error(
        "buy_order inválido:",
        buyOrder
      );

      return res.redirect(
        `${frontendUrl}/pago-resultado?estado=error`
      );
    }


    const pedido =
      await Order.findById(buyOrder);


    if (!pedido) {

      console.error(
        "Pedido no encontrado:",
        buyOrder
      );

      return res.redirect(
        `${frontendUrl}/pago-resultado?estado=error`
      );
    }


    // =================================================
    // PROTECCIÓN CONTRA DOBLE PROCESAMIENTO
    // =================================================

    if (pedido.estado === "pagado") {

      console.log(
        `Pedido ${pedido._id} ya estaba pagado. No se descuenta stock nuevamente.`
      );

      return res.redirect(
        `${frontendUrl}/pago-resultado?estado=exito&pedido=${pedido._id}`
      );
    }


    // =================================================
    // VALIDAR MONTO
    // =================================================

    const montoWebpay =
      Number(response.amount);

    const montoPedido =
      Number(pedido.total);


    if (
      !Number.isFinite(montoWebpay) ||
      !Number.isFinite(montoPedido) ||
      montoWebpay !== montoPedido
    ) {

      console.error(
        "Monto Webpay no coincide con pedido:",
        {
          montoWebpay,
          montoPedido,
          pedido: pedido._id,
        }
      );

      // El pago no debe marcarse como pagado
      if (pedido.estado === "pendiente") {

        pedido.estado = "cancelado";

        await pedido.save();
      }

      return res.redirect(
        `${frontendUrl}/pago-resultado?estado=error`
      );
    }


    // =================================================
    // VALIDAR RESPUESTA DE WEBPAY
    // =================================================

    const pagoAprobado =
      response.status === "AUTHORIZED" &&
      Number(response.response_code) === 0;


    // =================================================
    // PAGO RECHAZADO
    // =================================================

    if (!pagoAprobado) {

      if (pedido.estado === "pendiente") {

        pedido.estado = "cancelado";

        await pedido.save();
      }

      return res.redirect(
        `${frontendUrl}/pago-resultado?estado=rechazado&pedido=${pedido._id}`
      );
    }


    // =================================================
    // PAGO APROBADO
    // =================================================

    /*
     * Desde aquí necesitamos modificar:
     *
     * 1. Stock de todos los productos
     * 2. Estado del pedido
     * 3. Código de autorización
     *
     * Todo debe hacerse dentro de una transacción.
     */

    const session =
      await mongoose.startSession();


    try {

      await session.withTransaction(
        async () => {

          // -------------------------------------------
          // Volver a obtener el pedido dentro
          // de la transacción
          // -------------------------------------------

          const pedidoActual =
            await Order.findById(
              pedido._id
            ).session(session);


          if (!pedidoActual) {

            throw new Error(
              "Pedido no encontrado dentro de la transacción"
            );
          }


          // -------------------------------------------
          // Protección adicional contra doble pago
          // -------------------------------------------

          if (
            pedidoActual.estado === "pagado"
          ) {

            return;
          }


          // -------------------------------------------
          // DESCONTAR STOCK
          // -------------------------------------------

          for (
            const item of pedidoActual.items
          ) {

            const cantidad =
              Number(item.cantidad);


            if (
              !Number.isInteger(cantidad) ||
              cantidad <= 0
            ) {

              throw new Error(
                `Cantidad inválida para ${item.nombre}`
              );
            }


            /*
             * findOneAndUpdate con:
             *
             * stock >= cantidad
             *
             * hace que MongoDB compruebe y descuente
             * el stock en una sola operación.
             */

            const productoActualizado =
              await Product.findOneAndUpdate(

                {
                  _id: item.producto,

                  activo: true,

                  stock: {
                    $gte: cantidad,
                  },
                },

                {
                  $inc: {
                    stock: -cantidad,
                  },
                },

                {
                  new: true,

                  session,
                }
              );


            // Si no encontramos el producto o
            // no tiene suficiente stock,
            // abortamos TODA la transacción.

            if (!productoActualizado) {

              throw new Error(
                `Stock insuficiente para ${item.nombre}`
              );
            }
          }


          // -------------------------------------------
          // MARCAR PEDIDO COMO PAGADO
          // -------------------------------------------

          pedidoActual.estado =
            "pagado";


          pedidoActual.codigoTransaccion =
            response.authorization_code ||
            token;


          await pedidoActual.save({
            session,
          });
        }
      );


      // -----------------------------------------------
      // TRANSACCIÓN COMPLETADA
      // -----------------------------------------------

      console.log(
        `Pedido ${pedido._id} pagado correctamente`
      );


      // No se espera (await) intencionalmente: el correo
      // nunca debe demorar ni romper la respuesta al cliente.
      // enviarCorreoConfirmacionCompra ya maneja sus propios
      // errores internamente y no los relanza.
      enviarCorreoConfirmacionCompra(pedido);


      return res.redirect(
        `${frontendUrl}/pago-resultado?estado=exito&pedido=${pedido._id}`
      );


    } catch (transactionError) {

      console.error(
        "Error procesando stock/pedido:",
        transactionError
      );


      /*
       * IMPORTANTE:
       *
       * Si el pago fue aprobado pero no pudimos
       * descontar stock, NO marcamos el pedido
       * como pagado.
       *
       * La transacción hace rollback automático.
       */

      return res.redirect(
        `${frontendUrl}/pago-resultado?estado=error&pedido=${pedido._id}`
      );

    } finally {

      await session.endSession();
    }


  } catch (error) {

    console.error(
      "Error confirmando Webpay:",
      error
    );


    return res.redirect(
      `${frontendUrl}/pago-resultado?estado=error`
    );
  }
};


// =====================================================
// CONSULTAR ESTADO DE TRANSACCIÓN
// =====================================================

export const getTransactionStatus = async (
  req,
  res
) => {

  try {

    const response =
      await webpayTransaction.status(
        req.params.token
      );

    return res.json(response);

  } catch (error) {

    console.error(
      "Error consultando estado Webpay:",
      error
    );

    return res.status(500).json({
      message:
        "Error al consultar el estado de la transacción",
    });
  }
};