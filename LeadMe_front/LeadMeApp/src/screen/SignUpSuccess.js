import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

const SignUpSuccess = ({ route, navigation }) => {
  const { nickname } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>가입완료</Text>
      <Text style={styles.text}>회원가입이 완료되었습니다.</Text>
      <Text style={styles.text}>
        <Text style={styles.nickname}>{nickname || 'xxx'}</Text> 님 회원 가입을 환영합니다.
      </Text>
      <Text style={styles.text}>
        로그인 버튼을 누르시면{'\n'}로그인 화면으로 이동합니다.
      </Text>

      <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>로그인</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE7C1',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  text: {
    fontSize: 16,
    color: '#222',
    marginVertical: 4,
    textAlign: 'center',
  },
  nickname: {
    fontWeight: 'bold',
    color: '#000',
  },
  loginBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 30,
    shadowColor: '#000',
    elevation: 3,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpSuccess;
