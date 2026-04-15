const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const getExchange = async (id) => {
  const url = id ? `${API_URL}/exchanges/${id}` : `${API_URL}/exchanges?per_page=15&page=1`

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
    return null;
  }
}

export default getExchange