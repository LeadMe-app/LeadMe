import React, { useState, useEffect } from 'react';
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

  // 실패 카운트 및 잠금 관리 상태
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockEndTime, setLockEndTime] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // 타이머를 사용해 남은 잠금 시간을 업데이트.

  useEffect(() => {
    let timer;
    if (isLocked){
      timer = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((lockEndTime - now) / 1000);
        if (diff <= 0){
          clearInterval(timer);
          setIsLocked(false);
          setFailedAttempts(0);
          setRemainingSeconds(0);

        }else {
          setRemainingSeconds(diff);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    }
  }, [isLocked, lockEndTime]);

   {/*로그인 시도*/}
   const handleLogin = async () => {

    if (isLocked) {
      setErrors({general: `로그인 잠금: ${remainingSeconds}초 후에 다시 시도하세요.`});
      return;
    }
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

      // 로그인 성공 시 실패 카운트 초기화.
      setFailedAttempts(0);
      setErrors({general: ''});
      navigation.navigate('HomeScreen');
    } catch (err) {
      console.error('로그인 실패:', err.response?.data || err);

      // 실패 카운트 증가.
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);

      // 5회 실패 시 30초 잠금.
      if (newCount >= 5){
        const lockUntil = Date.now() + 3000;
        setIsLocked(true);
        setLockEndTime(lockUntil);
        setErrors({general: '로그인 5회 실패 30초간 잠금됩니다.'});
      } else{
        setErrors({general: `로그인에 실패했습니다. 남은 기회 ${5 - newCount}회`});
      }
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

      <TouchableOpacity 
      style={styles.experienceButton}
      onPress={()=> navigation.navigate('PreExperience')}>
        <Text style={styles.experienceButtonText}>사전 체험하기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

