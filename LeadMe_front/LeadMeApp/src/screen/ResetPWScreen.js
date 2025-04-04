import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
  } from 'react-native';

const ResetPWScreen = ({ navigation }) => {
  const [password, setPassword] = useState("");
  const [confirmPW, setConfirmPW] = useState("");
  const [message, setMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const resetPW = () => {
    if (password === confirmPW) { 
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

        {/* 비밀번호 변경 성공 시 -> 팝업 */}
        <Modal transparent={true} visible={modalVisible} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>비밀번호 변경 완료</Text>
                    <Text>비밀번호가 성공적으로 변경되었습니다.</Text>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.buttonText}>로그인</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    
       {/* 변경 실패 -> 에러 메시지 */}
       {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>뒤로 가기</Text>
        </TouchableOpacity>
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
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)", // 반투명 배경
    },
    modalView: {
        width: "80%",
        backgroundColor: "#FFF",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5, // 안드로이드 그림자 효과
    },
    modalText: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    backBtn: {
        backgroundColor: '#2ECC71',
        padding: 14,
        width: '100%',
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
      },
    backText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
