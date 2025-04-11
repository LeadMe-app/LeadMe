import React from 'react';
import {Modal} from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

const SignUpSuccessModal = ({ visible, onClose, nickname = 'xxx' }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>가입완료</Text>
          <Text style={styles.text}>회원가입이 완료되었습니다.</Text>
          <Text style={styles.text}>
            <Text style={styles.nickname}>{nickname}</Text> 님 회원 가입을 환영합니다.
          </Text>
          <Text style={styles.text}>
            로그인 버튼을 누르시면{'\n'}로그인 화면으로 이동합니다.
          </Text>

          <TouchableOpacity style={styles.loginBtn} onPress={onClose}>
            <Text style={styles.loginText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // 흐림 배경
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFE7C1',
    borderRadius: 30,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
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
    marginTop: 20,
    shadowColor: '#000',
    elevation: 3,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpSuccessModal;
