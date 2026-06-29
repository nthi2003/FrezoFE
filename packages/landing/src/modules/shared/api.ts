import axios from 'axios';

// Create a configured axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle global errors here (e.g., redirect to login on 401)
    if (error.response?.status === 401) {
      const event = new CustomEvent('auth:logout');
      window.dispatchEvent(event);
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);
