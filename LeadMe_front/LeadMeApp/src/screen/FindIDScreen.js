import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
  } from 'react-native';
import BackButton from "../components/BackButton";

const FindIDScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const findID = () => {
    if (name === "na" && phone === "1234") { // 조회 구현 필요
      setMessage("아이디는 user123 입니다.");
    } else {
      setMessage("회원정보가 존재하지 않습니다.");
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.logo}>LEAD ME</Text>
        <Text style={styles.header}>아이디 찾기</Text>
        
        {/* 이름, 전화번호 입력 */}
        <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="전화번호" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        
        <TouchableOpacity style={styles.button} onPress={findID}>
            <Text style={styles.buttonText}>아이디 찾기</Text>
        </TouchableOpacity>

        {/* 아이디 찾기 실패 */}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        
        <BackButton />
        </View>
    );
};

export default FindIDScreen;

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
