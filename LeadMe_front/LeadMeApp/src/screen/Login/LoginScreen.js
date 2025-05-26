import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 토큰 저장
import qs from 'qs'; // form
import { styles } from './styles';
import Logo from '../../components/Logo';

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    userId: '',
    password: '',
    general: '',
  });
   {/*로그인 시도*/}
   const handleLogin = async () => {
    if (!userId || !password) {
      setErrors({ general: '모든 정보를 입력해주세요.' }); // 사라지게 하는 방법
      return;
    }
  
    try {
      const requestBody = qs.stringify({
        username: userId,
        password: password,
      });
      const res = await axiosInstance.post('/api/auth/login', requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded', 
          },
        });
      const { access_token } = res.data;

      {/* 로그인 성공 시 토큰 저장 */}
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('userId', userId.toString()); 
        
      const userInfoRes = await axiosInstance.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
  
      const { username,  age_group } = userInfoRes.data;
      await AsyncStorage.setItem('age_group', age_group);
      await AsyncStorage.setItem('username', username);
      
      console.log('로그인 성공 및 토큰 저장 완료!', res.data);
      navigation.navigate('HomeScreen');
    } catch (err) {
      console.error('로그인 실패:', err.response?.data || err);
      setErrors({ general: '로그인에 실패했습니다. 정보를 확인해주세요.' });
    }
  };

  return (
    <View style={styles.container}>
      <Logo />

      {/* 아이디 입력 */}
      <TextInput
        placeholder="아이디를 입력하세요"
        value={userId}
        onChangeText={setUserId}
        style={styles.input}
      />

      {/* 비밀번호 입력 */}
      <TextInput
        placeholder="비밀번호를 입력하세요"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {/* 에러 메시지 */}
      {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('FindID')}>
          <Text style={styles.linkText}>아이디 찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('FindPW')}>
          <Text style={styles.linkText}>비밀번호 찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.linkText}>회원가입</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.experienceButton}>
        <Text style={styles.experienceButtonText}>사전 체험하기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
