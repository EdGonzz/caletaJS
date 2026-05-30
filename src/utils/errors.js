/**
 * @fileoverview Capa centralizada de manejo de errores para CaletaJS.
 * Proporciona clases de error tipadas, un helper de fetch y mensajes amigables.
 */

/**
 * Tipos de error reconocidos por la app.
 * @enum {string}
 */
export const ErrorType = {
  NETWORK: 'NETWORK',       // Sin conexión / fetch falló
  RATE_LIMIT: 'RATE_LIMIT', // HTTP 429
  NOT_FOUND: 'NOT_FOUND',   // HTTP 404
  SERVER: 'SERVER',         // HTTP 5xx
  PARSE: 'PARSE',           // JSON malformado
  ABORT: 'ABORT',           // AbortController canceló la petición
  UNKNOWN: 'UNKNOWN',       // Error no clasificado
};

/**
 * Error tipado para fallos de la API.
 */
export class ApiError extends Error {
  /**
   * @param {string} type - Uno de los valores de ErrorType
   * @param {string} message - Mensaje técnico (para logs)
   * @param {number|null} [status] - Código HTTP si aplica
   */
  constructor(type, message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Mapea un tipo de error a un mensaje legible para el usuario.
 * @param {string} type - Valor de ErrorType
 * @returns {string}
 */
export const getErrorMessage = (type) => {
  switch (type) {
    case ErrorType.NETWORK:
      return 'Sin conexión. Verifica tu red e intenta de nuevo.';
    case ErrorType.RATE_LIMIT:
      return 'Demasiadas peticiones. Espera un momento e intenta de nuevo.';
    case ErrorType.NOT_FOUND:
      return 'El recurso solicitado no fue encontrado.';
    case ErrorType.SERVER:
      return 'Error en el servidor. Intenta de nuevo en unos minutos.';
    case ErrorType.PARSE:
      return 'Error al procesar la respuesta del servidor.';
    case ErrorType.ABORT:
      return 'La petición fue cancelada.';
    default:
      return 'Algo salió mal. Intenta de nuevo.';
  }
};

/**
 * Clasifica un error HTTP por su código de estado.
 * @param {number} status
 * @returns {string} Valor de ErrorType
 */
const classifyHttpStatus = (status) => {
  if (status === 429) return ErrorType.RATE_LIMIT;
  if (status === 404) return ErrorType.NOT_FOUND;
  if (status >= 500) return ErrorType.SERVER;
  return ErrorType.UNKNOWN;
};

/**
 * Helper de fetch que lanza ApiError tipado en caso de fallo.
 * Maneja: sin conexión, errores HTTP, JSON malformado, cancelaciones.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>} - JSON parseado de la respuesta
 * @throws {ApiError}
 */
export const apiFetch = async (url, options = {}) => {
  let response;

  try {
    response = await fetch(url, options);
  } catch (err) {
    // AbortError: petición cancelada intencionalmente
    if (err?.name === 'AbortError') {
      throw new ApiError(ErrorType.ABORT, 'Request aborted');
    }
    // TypeError / Failed to fetch: sin conexión o CORS
    throw new ApiError(
      ErrorType.NETWORK,
      `Network error: ${err?.message ?? 'Unknown'}`,
    );
  }

  if (!response.ok) {
    const type = classifyHttpStatus(response.status);
    throw new ApiError(
      type,
      `HTTP ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  try {
    return await response.json();
  } catch (err) {
    // Si el stream se canceló durante el parse, reclasificar como ABORT (no PARSE)
    if (err?.name === 'AbortError' || err instanceof DOMException) {
      throw new ApiError(ErrorType.ABORT, `Request aborted: ${err?.message ?? ''}`);
    }
    throw new ApiError(ErrorType.PARSE, `Failed to parse JSON: ${err?.message ?? ''}`);
  }
};
