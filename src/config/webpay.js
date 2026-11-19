import pkg from "transbank-sdk";

const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = pkg;

function getWebpayOptions() {
  const webpayEnv = (process.env.WEBPAY_ENV || "").trim().toLowerCase();

  const commerceCode = (
    process.env.WEBPAY_COMMERCE_CODE || ""
  ).trim();

  const apiKey = (process.env.WEBPAY_API_KEY || "").trim();

  // Producción si WEBPAY_ENV lo dice, o si el servidor es el real
  // (api.mtetoys.cl) y hay credenciales cargadas. Esto evita caer en
  // pruebas por error si cPanel no entrega WEBPAY_ENV a la app.
  const esServidorReal = (process.env.BACKEND_URL || "").includes("api.mtetoys.cl");

  const isProduction =
    webpayEnv === "production" ||
    (esServidorReal && Boolean(commerceCode) && Boolean(apiKey));

  if (isProduction) {
    if (!commerceCode || !apiKey) {
      throw new Error(
        "Faltan WEBPAY_COMMERCE_CODE / WEBPAY_API_KEY en las variables de entorno para producción"
      );
    }

    return new Options(
      commerceCode,
      apiKey,
      Environment.Production
    );
  }

  // Ambiente de integración (pruebas) de Transbank: código y llave públicos, sin datos sensibles
  return new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
}

// Diagnóstico: queda en stderr.log al iniciar la app (sin mostrar llaves)
console.error(
  `[Webpay] modo: ${
    (() => {
      const o = getWebpayOptions();
      return o.environment === Environment.Production ? "PRODUCCIÓN" : "INTEGRACIÓN (pruebas)";
    })()
  } | WEBPAY_ENV="${process.env.WEBPAY_ENV}" | BACKEND_URL ${process.env.BACKEND_URL ? "definida" : "NO definida"} | código ...${(process.env.WEBPAY_COMMERCE_CODE || "").trim().slice(-4)} | llave ${(process.env.WEBPAY_API_KEY || "").trim().length} caracteres`
);

export const webpayTransaction = new WebpayPlus.Transaction(getWebpayOptions());