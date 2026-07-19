import axios from 'axios'

// Use relative path so Vite proxy handles routing — works on localhost AND mobile (via IP:3000)
const API_URL = '/api'

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export default client
