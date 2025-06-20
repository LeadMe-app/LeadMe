import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';
import {CommonActions} from '@react-navigation/native';
//import LoginScreen from '../screen/Login/LoginScreen'; Require cycle 발생


export const navigationRef = {
  current: null,
};
const axiosInstance = axios.create({
  //baseURL: 'https://a2a5-220-67-223-53.ngrok-free.app', //ngrok 임시 퍼블릭 URL
  baseURL: 'http://3.36.186.136:8000',
  timeout: 15000,
});

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    
    if (status === 401 && !requestUrl.includes('/api/auth/login')){
      await AsyncStorage.multiRemove(['access_token', 'userId', 'age_group', 'username']);

      Alert.alert('세션 만료', '다른 기기에서 로그인되어 로그아웃되었습니다.');
      if (navigationRef.current){
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Login'}],
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
