import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
  } from 'react-native';
import BackButton from "../components/BackButton";
import axiosInstance from "../config/axiosInstance";

const FindPWScreen = ({ navigation }) => {
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const findpw = async () => {
    if (!userId || !phone){
        setMessage("모든 정보를 입력해주세요.");
        return;
    }try {
        const res = await axiosInstance.post("/api/auth/verify-reset-user", {
          username: userId,
          phone_number: phone,
        },
        {
            headers: {
              'Content-Type': 'application/json', 
            },
          });
  
          navigation.navigate("ResetPW", {
            username: userId,
            phone_number: phone,
          });
      } catch (err) {
        console.error("사용자 확인 실패:", err.response?.data || err);
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
        
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={findpw}>
            <Text style={styles.buttonText}>비밀번호 찾기</Text>
        </TouchableOpacity>

        <BackButton />
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
});
