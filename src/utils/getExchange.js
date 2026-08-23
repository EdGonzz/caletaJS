/**
 * @fileoverview Obtiene datos de exchanges desde la API de CoinGecko.
 */

import { apiFetch, ApiError, ErrorType } from './errors.js';

// Backend Proxy URL
const PROXY_URL = '/api/proxy';

/** @type {RequestInit} */
const baseOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Obtiene la lista de exchanges o un exchange específico.
 * @param {string} [id] - ID del exchange
 * @returns {Promise<any>}
 * @throws {ApiError} en caso de error de red, rate-limit o servidor
 */
const getExchange = async (id) => {
  const url = id
    ? `${PROXY_URL}?endpoint=/exchanges/${id}`
    : `${PROXY_URL}?endpoint=/exchanges&per_page=15&page=1`;

  return apiFetch(url, baseOptions);
};

export default getExchange;