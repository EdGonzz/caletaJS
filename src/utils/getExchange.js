const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const options = {
  method: 'GET',
  headers: {
    'x-cg-demo-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
};

/**
 * Obtiene la lista de exchanges o un exchange específico.
 * @param {string} [id] - ID del exchange
 * @returns {Promise<any>}
 */
const getExchange = async (id) => {
  const url = id ? `${API_URL}/exchanges/${id}` : `${API_URL}/exchanges?per_page=15&page=1`;

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Exchange API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching exchange data:', error);
    return null;
  }
};

export default getExchange;