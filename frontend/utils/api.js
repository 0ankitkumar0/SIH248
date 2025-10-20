import axios from 'axios'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://rakeopt-backend.onrender.com/',
})

export async function optimize(payload) {
  try {
    const res = await API.post('/optimize', payload)
    if (res.data && res.data.error) throw new Error(res.data.error)
    return res.data
  } catch (err) {
    // normalize axios error
    if (err.response && err.response.data) {
      const d = err.response.data
      const msg = d.detail || d.error || JSON.stringify(d)
      throw new Error(msg)
    }
    throw err
  }
}

export default API
