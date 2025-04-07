import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: ' https://e53e-59-28-10-158.ngrok-free.app', //ngrok 임시 퍼블릭 URL
  timeout: 5000,
  /*headers: {
    'Content-Type': 'application/json',
  }, 로그인 페이지 때문에... */
});

export default axiosInstance;
