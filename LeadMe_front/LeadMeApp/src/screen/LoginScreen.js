import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!userId || !password) {
      setError('아이디 및 비밀번호를 다시 확인해주세요.');
    } else {
      setError('');
      console.log('로그인 시도:', userId, password);
      // TODO: 로그인 API 요청 처리
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEAD ME</Text>

      <TextInput
        placeholder="아이디를 입력하세요"
        value={userId}
        onChangeText={setUserId}
        style={styles.input}
      />

      <TextInput
        placeholder="비밀번호를 입력하세요"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>아이디 찾기</Text>
        <Text style={styles.linkText}>비밀번호 찾기</Text>
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
