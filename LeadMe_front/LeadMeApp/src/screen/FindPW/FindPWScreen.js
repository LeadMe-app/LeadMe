import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
  } from 'react-native';
  import BackButton from '../../components/BackButton';
  import axiosInstance from '../../config/axiosInstance';
import {styles} from './styles';
import Logo from '../../components/Logo';

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
        < Logo />
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
