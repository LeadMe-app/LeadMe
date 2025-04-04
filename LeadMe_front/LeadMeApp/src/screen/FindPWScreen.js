import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
  } from 'react-native';

const FindPWScreen = ({ navigation }) => {
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const findpw = () => {
    if (userId === "user123" && phone === "1234") { // 조회 구현 필요
        navigation.navigate("ResetPW");
    } else {
      setMessage("회원정보가 존재하지 않습니다.");
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.logo}>LEAD ME</Text>
        <Text style={styles.header}>비밀번호 찾기</Text>
        
        {/* 아이디, 전화번호 입력 */}
        <TextInput style={styles.input} placeholder="아이디" value={userId} onChangeText={setUserId} />
        <TextInput style={styles.input} placeholder="전화번호" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        
        <TouchableOpacity style={styles.button} onPress={findpw}>
            <Text style={styles.buttonText}>비밀번호 찾기</Text>
        </TouchableOpacity>

        {/* 비밀번호 찾기 실패 */}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>뒤로 가기</Text>
        </TouchableOpacity>
        </View>
    );
};

export default FindPWScreen;

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
