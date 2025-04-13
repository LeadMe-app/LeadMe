import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
  } from 'react-native';
  import BackButton from '../../components/BackButton';
  import axiosInstance from '../../config/axiosInstance';
import { styles } from './styles';
import Logo from '../../components/Logo';

const FindIDScreen = ({ navigation }) => {
  const [nickname, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(""); // 아이디 보여주기

  const findID = async () => {
    if (!nickname || !phone){
        setMessage("모든 정보를 입력해주세요.");
        return;
    }
    try {
        const res = await axiosInstance.post("/api/auth/find-username", {
          nickname: nickname,
          phone_number: phone,
        },
        {
            headers: {
              'Content-Type': 'application/json', 
            },
          });
  
        const { username } = res.data;
        setMessage(`아이디는 ${username} 입니다.`);
      } catch (err) {
        console.error("아이디 찾기 실패:", err.response?.data || err);
        setMessage("회원정보가 존재하지 않습니다.");
      }
    };

  return (
    <View style={styles.container}>
        < Logo />
        <Text style={styles.header}>아이디 찾기</Text>
        
        {/* 이름, 전화번호 입력 */}
        <TextInput style={styles.input} placeholder="이름" value={nickname} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="전화번호" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={findID}>
            <Text style={styles.buttonText}>아이디 찾기</Text>
        </TouchableOpacity>

        <BackButton />
        </View>
    );
};

export default FindIDScreen;