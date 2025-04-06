import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
  } from 'react-native';
import SuccessModal from "../components/SuccessModal";
import BackButton from "../components/BackButton";
import axiosInstance from "../config/axiosInstance";

const ResetPWScreen = ({ route, navigation }) => {
  const { username, phone_number } = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage("비밀번호를 모두 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await axiosInstance.post("/api/auth/reset-password", {
        username: username,
        new_password: newPassword,
        new_password_confirm : confirmPassword,
      });

      console.log("비밀번호 재설정 성공:", res.data);
      setMessage("비밀번호가 성공적으로 재설정되었습니다.");
      setModalVisible(true);
    } catch (err) {
      console.error("비밀번호 재설정 실패:", err.response?.data || err);
      setMessage("비밀번호 재설정 중 오류가 발생했습니다.");
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.logo}>LEAD ME</Text>
        <Text style={styles.header}>비밀번호 변경</Text>

        {/* 비밀번호 입력 */}
        <TextInput style={styles.input} placeholder="비밀번호" value={newPassword} onChangeText={setNewPassword} />
        <TextInput style={styles.input} placeholder="비밀번호 재확인" value={confirmPassword} onChangeText={setConfirmPassword} />
        
        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>비밀번호 변경</Text>
        </TouchableOpacity>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* 성공 모달 */}
       <SuccessModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          navigation.navigate("Login"); // 로그인 페이지 이동
        }}
      />
    

       <BackButton />
       </View>
    );
};

export default ResetPWScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF6EB',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20, 
    },
    logo: { 
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8E44AD',
        marginBottom: 40,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
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
    button: {
        backgroundColor: '#007BFF',
        padding: 14,
        width: '100%',
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    message: { 
        color: "red", 
        marginTop: 15, 
    },
});
