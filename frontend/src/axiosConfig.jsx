import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: 'http://localhost:5001/api', // local
  baseURL: 'http://52.63.158.152:5001', // live
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
