import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://f540-222-236-105-13.ngrok-free.app', //ngrok 임시 퍼블릭 URL
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
