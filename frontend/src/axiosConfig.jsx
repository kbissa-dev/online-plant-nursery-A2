import axios from 'axios';

const axiosInstance = axios.create({
  
  // baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001',
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);


export default axiosInstance;