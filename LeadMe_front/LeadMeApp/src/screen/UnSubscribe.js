import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const UnSubscribe = ({ navigation }) => {
  const handleUnSubscribe = () => {
    // TODO: 백엔드에 회원탈퇴 요청 보내기 (axios import 미리 해놨습니다.)
    
    alert('회원탈퇴가 완료되었습니다.');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={24} color="#000" />
      </TouchableOpacity>

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
