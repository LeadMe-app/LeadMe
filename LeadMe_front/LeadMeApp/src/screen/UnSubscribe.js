import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import axiosInstance from '../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UnSubscribe = ({ navigation }) => {
  const handleUnSubscribe = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      // 현재 로그인한 사용자 정보 가져오기
      const userInfoRes = await axiosInstance.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userId = userInfoRes.data.user_id;

      // 탈퇴 요청 보내기
      await axiosInstance.delete(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('알림', '회원탈퇴가 완료되었습니다.');
      await AsyncStorage.removeItem('access_token'); // 토큰 제거
      navigation.navigate('Login');
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      Alert.alert('오류', '회원탈퇴에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>탈퇴하시겠습니까?</Text>
      <Text style={styles.text}>
        탈퇴하시면 학습 내역은 초기화되며{'\n'}계정은 영구삭제됩니다.
      </Text>
      <Text style={styles.text}>
        동의하시면 회원탈퇴 버튼을 눌러주세요.
      </Text>

      <TouchableOpacity style={styles.withdrawBtn} onPress={handleUnSubscribe}>
        <Text style={styles.withdrawText}>회원탈퇴</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>취소</Text>
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
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111',
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    color: '#444',
    marginBottom: 4,
  },
  withdrawBtn: {
    marginTop: 30,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
  },
  withdrawText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UnSubscribe;
