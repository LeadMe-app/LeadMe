import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,  Alert, BackHandler
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
          setErrors(prev => ({ ...prev, general: '' }));
        }else {
          setRemainingSeconds(diff);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    }
  }, [isLocked, lockEndTime]);

   // 뒤로가기 버튼 핸들링
    useFocusEffect(
      useCallback(() => {
        const onBackPress = () => {
          Alert.alert('앱 종료', '앱을 종료하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '종료', onPress: () => BackHandler.exitApp() },
          ]);
          return true;
        };
  
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
  
        return () => subscription.remove(); // ✅ 최신 방식
      }, [])
    );

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
      setErrors({ userId: '', password: '', general: '...' });
      navigation.navigate('HomeScreen');
    } catch (err) {
      console.error('로그인 실패:', err.response?.data || err);

      const statusCode = err.response?.status;
      const detailMessage = err.response?.data?.detail;

      if (statusCode === 429) {
        // ⏳ 백엔드에서 잠금 걸림
        setIsLocked(true);
        setLockEndTime(Date.now() + 30000); // 서버에서 보내준 시간을 활용하면 더 정확
        setErrors({ general: detailMessage || '로그인 제한 중입니다.' });
        return;
      }
      
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);

      if (newCount >= 5) {
        const lockUntil = Date.now() + 30000;
        setIsLocked(true);
        setLockEndTime(lockUntil);
        setErrors({
          general: '로그인 5회 실패. 30초간 잠금됩니다.',
        });
      } else {
        setErrors({
          general: detailMessage
            ? detailMessage // ✅ 서버가 보낸 메시지 사용
            : `로그인에 실패했습니다. 남은 기회 ${5 - newCount}회`,
        });
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

      <TouchableOpacity
        style={[
          styles.loginButton,
          isLocked && { backgroundColor: '#ccc' } // 비활성화 시 색상 변경
        ]}
        onPress={handleLogin}
        disabled={isLocked} // 버튼 비활성화
        activeOpacity={isLocked ? 1 : 0.7} 
      >
        <Text style={[styles.loginButtonText, isLocked && { color: '#666' } ]}>
          {isLocked ? `잠김(${remainingSeconds}s)` : '로그인'}
        </Text>
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

