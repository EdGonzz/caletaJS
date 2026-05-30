/**
 * @fileoverview Obtiene datos de exchanges desde la API de CoinGecko.
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
 * Obtiene la lista de exchanges o un exchange específico.
 * @param {string} [id] - ID del exchange
 * @returns {Promise<any>}
 * @throws {ApiError} en caso de error de red, rate-limit o servidor
 */
const getExchange = async (id) => {
  const url = id
    ? `${API_URL}/exchanges/${id}`
    : `${API_URL}/exchanges?per_page=15&page=1`;

  return apiFetch(url, baseOptions);
};

export default getExchange;