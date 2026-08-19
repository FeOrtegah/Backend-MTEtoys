import pkg from "transbank-sdk";

const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = pkg;

function getWebpayOptions() {
  const webpayEnv = (process.env.WEBPAY_ENV || "").trim();
  const isProduction = webpayEnv === "production";

  const commerceCode = (
    process.env.WEBPAY_COMMERCE_CODE || ""
  ).trim();

  const apiKey = (process.env.WEBPAY_API_KEY || "").trim();

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

export const webpayTransaction = new WebpayPlus.Transaction(getWebpayOptions());