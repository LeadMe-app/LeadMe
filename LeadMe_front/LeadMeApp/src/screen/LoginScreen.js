import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import axiosInstance from '../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 토큰 저장
import qs from 'qs'; // form

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
      console.log('로그인 성공 및 토큰 저장 완료!', res.data);
      //navigation.navigate('EditProfileScreen'); 이동 구현 필요
    } catch (err) {
      console.error('로그인 실패:', err.response?.data || err);
      console.log(
        "보내는 값:", 
        new URLSearchParams({ username: userId, password: password }).toString()
      );
      setErrors({ general: '로그인에 실패했습니다. 정보를 확인해주세요.' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEAD ME</Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8E44AD',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginVertical: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 5, 
  },
  linkText: {
    color: '#666',
    fontSize: 13, 
  },
  experienceButton: {
    width: '50%',
    height: 50,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 50,
  },
  experienceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
