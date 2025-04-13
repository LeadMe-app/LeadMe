// src/components/UnSubscribeModal.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import axiosInstance from '../config/axiosInstance';  // axios 인스턴스 가져오기
import AsyncStorage from '@react-native-async-storage/async-storage';  // AsyncStorage 사용

const UnSubscribeModal = ({ visible, onClose, navigation={navigation} }) => {
  const handleUnSubscribe = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        Alert.alert('오류', '로그인 정보가 없습니다. 다시 로그인해주세요.');
        return;
      }

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
      navigation.navigate('Login');  // 로그인 화면으로 네비게이션

    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      Alert.alert('오류', '회원탈퇴에 실패했습니다.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>탈퇴하시겠습니까?</Text>
          <Text style={styles.text}>
            탈퇴하시면 학습 내역은 초기화되며{'\n'}계정은 영구삭제됩니다.
          </Text>
          <Text style={styles.text}>동의하시면 회원탈퇴 버튼을 눌러주세요.</Text>

          <TouchableOpacity style={styles.withdrawBtn} onPress={handleUnSubscribe}>
            <Text style={styles.withdrawText}>회원탈퇴</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111',
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    color: '#444',
    marginBottom: 6,
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
  cancelBtn: {
    marginTop: 20,
    backgroundColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 12,
  },
  cancelText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UnSubscribeModal;
