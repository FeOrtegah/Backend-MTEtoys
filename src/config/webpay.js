import pkg from "transbank-sdk";

const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = pkg;

function getWebpayOptions() {
  const isProduction = process.env.WEBPAY_ENV === "production";

  if (isProduction) {
    if (!process.env.WEBPAY_COMMERCE_CODE || !process.env.WEBPAY_API_KEY) {
      throw new Error(
        "Faltan WEBPAY_COMMERCE_CODE / WEBPAY_API_KEY en las variables de entorno para producción"
      );
    }

    return new Options(
      process.env.WEBPAY_COMMERCE_CODE,
      process.env.WEBPAY_API_KEY,
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