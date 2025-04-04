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

const ResetPWScreen = ({ navigation }) => {
  const [password, setPassword] = useState("");
  const [confirmPW, setConfirmPW] = useState("");
  const [message, setMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const resetPW = () => {
    if (password && password === confirmPW) { 
        setModalVisible(true);
    } else {
      setMessage("비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.logo}>LEAD ME</Text>
        <Text style={styles.header}>비밀번호 변경</Text>

        {/* 비밀번호 입력 */}
        <TextInput style={styles.input} placeholder="비밀번호" value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="비밀번호 재확인" value={confirmPW} onChangeText={setConfirmPW} />
        
        <TouchableOpacity style={styles.button} onPress={resetPW}>
            <Text style={styles.buttonText}>비밀번호 변경</Text>
        </TouchableOpacity>

        {/* 성공 모달 */}
       <SuccessModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          navigation.navigate("Login"); // 로그인 페이지 이동
        }}
      />
    
       {/* 변경 실패 -> 에러 메시지 */}
       {message ? <Text style={styles.message}>{message}</Text> : null}

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
