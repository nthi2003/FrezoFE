import axios, { type AxiosInstance } from 'axios'

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || '/ai'

const aiClient: AxiosInstance = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

aiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error)
  }
)

export default aiClient