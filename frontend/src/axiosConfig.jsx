import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001', // local
    //  baseURL: 'http://3.106.139.194:5001', // live
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // saved after login/register
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;