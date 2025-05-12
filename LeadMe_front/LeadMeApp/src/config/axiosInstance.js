import axios from 'axios';

const axiosInstance = axios.create({
  //baseURL: 'https://a2a5-220-67-223-53.ngrok-free.app', //ngrok 임시 퍼블릭 URL
  baseURL: 'http://3.36.186.136:8000',
  timeout: 5000,
  /*headers: {
    'Content-Type': 'application/json',
  }, 로그인 페이지 때문에... */
});

export default axiosInstance;
