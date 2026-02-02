const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const getData = async (id) => {
  const url = id ? `${API_URL}/coins/${id}` : `${API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1`

  const options = {
    method: 'GET',
    headers: {
      'x-cg-demo-api-key': API_KEY,
      'Content-Type': 'application/json'
    }
  }

  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching data:', error)
    return null; // Return null instead of undefined for better error handling in UI
  }
}

export default getData