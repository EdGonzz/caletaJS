/**
 * @fileoverview Obtiene el historial de precios de una moneda desde CoinGecko.
 */

import { apiFetch, ApiError, ErrorType } from './errors.js';

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

/** @type {RequestInit} */
const baseOptions = {
  method: 'GET',
  headers: {
    'x-cg-demo-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
};

/**
 * @typedef {Object} PricePoint
 * @property {string|number} time - YYYY-MM-DD para períodos >7d, Unix timestamp (seg) para períodos ≤7d
 * @property {number} value - El precio en USD
 */

/**
 * Obtiene el historial de precios de una coin en USD.
 * Lanza ApiError en caso de fallo de red, rate-limit o servidor.
 *
 * Nota sobre cancelaciones: si el AbortSignal se activa, apiFetch lanza
 * ApiError(ErrorType.ABORT). El caller es responsable de detectarlo e ignorarlo
 * (p.ej. comprobando `err.type === ErrorType.ABORT`) — esta función no lo suprime.
 *
 * @param {string} coinId - CoinGecko coin ID (ej: "bitcoin")
 * @param {number} [days=30] - Número de días (1, 7, 30, 90, 365)
 * @param {AbortSignal|null} [signal] - Señal para abortar la petición
 * @returns {Promise<PricePoint[]>}
 * @throws {ApiError} en caso de error de red, rate-limit, servidor o cancelación (ABORT)
 */
export const getCoinHistory = async (coinId, days = 30, signal = null) => {
  if (!coinId) return [];

  // Para períodos <= 7 días omitimos interval=daily para obtener granularidad intradía
  const intervalParam = days <= 7 ? '' : '&interval=daily';
  const url = `${API_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}${intervalParam}`;

  const fetchOptions = signal ? { ...baseOptions, signal } : baseOptions;

  // Lanza ApiError en caso de fallo — el caller decide cómo manejarlo
  const data = await apiFetch(url, fetchOptions);

  const prices = data?.prices;
  if (!prices || !Array.isArray(prices)) return [];

  // Períodos <= 7 días: devolver timestamps UNIX (segundos) para granularidad intradía.
  // Lightweight Charts acepta UTCTimestamp en segundos desde epoch.
  // Períodos > 7 días: devolver YYYY-MM-DD (fecha completa, no hay granularidad intradía).
  const isIntraday = days <= 7;

  return prices.map(([ts, price]) => ({
    time: isIntraday ? Math.floor(ts / 1000) : new Date(ts).toISOString().split('T')[0],
    value: price,
  }));
};
