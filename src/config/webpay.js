import pkg from "transbank-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = pkg;

// =====================================================
// LOG DE DEPURACIÓN TEMPORAL
// =====================================================
// TODO: quitar esto una vez confirmado que toma producción.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG_PATH = path.join(__dirname, "..", "..", "webpay-debug.log");

function logDebug(mensaje) {
  try {
    fs.appendFileSync(
      DEBUG_LOG_PATH,
      `[${new Date().toISOString()}] ${mensaje}\n`
    );
  } catch {
    // Ignorar si ni siquiera se puede escribir el log.
  }
}

function getWebpayOptions() {
  const isProduction = process.env.WEBPAY_ENV === "production";

  logDebug(
    `WEBPAY_ENV="${process.env.WEBPAY_ENV}" (tipo: ${typeof process.env.WEBPAY_ENV}) isProduction=${isProduction} WEBPAY_COMMERCE_CODE=${process.env.WEBPAY_COMMERCE_CODE ? "definida (" + process.env.WEBPAY_COMMERCE_CODE.length + " caracteres)" : "NO DEFINIDA"} WEBPAY_API_KEY=${process.env.WEBPAY_API_KEY ? "definida (" + process.env.WEBPAY_API_KEY.length + " caracteres)" : "NO DEFINIDA"}`
  );

  if (isProduction) {
    if (!process.env.WEBPAY_COMMERCE_CODE || !process.env.WEBPAY_API_KEY) {
      logDebug(
        "ERROR: WEBPAY_ENV=production pero faltan WEBPAY_COMMERCE_CODE o WEBPAY_API_KEY"
      );

      throw new Error(
        "Faltan WEBPAY_COMMERCE_CODE / WEBPAY_API_KEY en las variables de entorno para producción"
      );
    }

    logDebug("USANDO: Environment.Production");

    return new Options(
      process.env.WEBPAY_COMMERCE_CODE,
      process.env.WEBPAY_API_KEY,
      Environment.Production
    );
  }

  logDebug("USANDO: Environment.Integration (simulado)");

  // Ambiente de integración (pruebas) de Transbank: código y llave públicos, sin datos sensibles
  return new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
}

export const webpayTransaction = new WebpayPlus.Transaction(getWebpayOptions());