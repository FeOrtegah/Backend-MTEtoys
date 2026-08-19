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

export function logDebug(mensaje) {
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
  const webpayEnv = (process.env.WEBPAY_ENV || "").trim();
  const isProduction = webpayEnv === "production";

  const commerceCode = (
    process.env.WEBPAY_COMMERCE_CODE || ""
  ).trim();

  const apiKey = (process.env.WEBPAY_API_KEY || "").trim();

  logDebug(
    `WEBPAY_ENV="${process.env.WEBPAY_ENV}" (trimmed="${webpayEnv}") isProduction=${isProduction} WEBPAY_COMMERCE_CODE=${commerceCode ? "definida (" + commerceCode.length + " caracteres)" : "NO DEFINIDA"} WEBPAY_API_KEY=${apiKey ? "definida (" + apiKey.length + " caracteres)" : "NO DEFINIDA"}`
  );

  if (isProduction) {
    if (!commerceCode || !apiKey) {
      logDebug(
        "ERROR: WEBPAY_ENV=production pero faltan WEBPAY_COMMERCE_CODE o WEBPAY_API_KEY"
      );

      throw new Error(
        "Faltan WEBPAY_COMMERCE_CODE / WEBPAY_API_KEY en las variables de entorno para producción"
      );
    }

    logDebug("USANDO: Environment.Production");

    return new Options(
      commerceCode,
      apiKey,
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