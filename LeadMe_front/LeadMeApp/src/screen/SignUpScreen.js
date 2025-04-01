import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const SignUpScreen = ({navigation}) => {
  const [userId, setUserId] = useState('');
  const [idChecked, setIdChecked] = useState(null); // null, true, false
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState({
    userId: '',
    password: '',
    general: '',
  });

  const checkIdDuplicate = () => {
    // 예시: 이미 존재하는 아이디 "test"
    if (userId.trim() === 'test') {
      setIdChecked(false);
      setErrors((prev) => ({ ...prev, userId: '이미 존재하는 아이디입니다.' }));
    } else {
      setIdChecked(true);
      setErrors((prev) => ({ ...prev, userId: '' }));
    }
  };

  const handleSubmit = () => {
    let valid = true;
    let newErrors = { userId: '', password: '', general: '' };

    if (!userId || !password || !confirmPw || !nickname || !phone || !age) {
      newErrors.general = '모든 정보를 입력해주세요.';
      valid = false;
    }

    if (password !== confirmPw) {
      newErrors.password = '비밀번호가 일치하지 않습니다.';
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      console.log('회원가입 완료!');
      // TODO: 회원가입 API 요청 처리
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LEAD ME</Text>
      <Text style={styles.heading}>회원가입</Text>

      {/* 아이디 + 중복확인 */}
      <View style={styles.row}>
        <TextInput
          placeholder="아이디"
          value={userId}
          onChangeText={setUserId}
          style={styles.inputWithButton}
        />
        <TouchableOpacity style={styles.checkBtn} onPress={checkIdDuplicate}>
          <Text style={styles.checkText}>중복확인</Text>
        </TouchableOpacity>
      </View>
      {errors.userId ? (
        <Text style={styles.error}>{errors.userId}</Text>
      ) : idChecked === true ? (
        <Text style={styles.success}>사용 가능한 아이디입니다.</Text>
      ) : null}

      {/* 비밀번호 */}
      <TextInput
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {/* 비밀번호 확인 */}
      <TextInput
        placeholder="비밀번호 재확인"
        secureTextEntry
        value={confirmPw}
        onChangeText={setConfirmPw}
        style={styles.input}
      />
      {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

      {/* 닉네임 */}
      <TextInput
        placeholder="닉네임"
        value={nickname}
        onChangeText={setNickname}
        style={styles.input}
      />

      {/* 전화번호 */}
      <TextInput
        placeholder="전화번호"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      {/* 연령대 드롭다운 */}
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={age}
          onValueChange={(itemValue) => setAge(itemValue)}
          style={styles.dropdown}
        >
          <Picker.Item label="연령대를 선택하세요." value="" />
          <Picker.Item label="어린이: 5 ~ 12세" value="10" />
          <Picker.Item label="청소년: 13세 ~ 19세" value="15" />
          <Picker.Item label="성인: 20세 이상" value="30" />
        </Picker>
      </View>
      

      {/* 모든 입력 오류 */}
      {errors.general ? <Text style={styles.error}>{errors.general}</Text> : null}

      {/* 회원가입 버튼 */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>회원가입</Text>
      </TouchableOpacity>

      {/* 뒤로 가기 버튼 (동작 연결은 필요시 navigation 추가) */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backText}>뒤로 가기</Text>
      </TouchableOpacity>
      
    
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#8E44AD', marginTop: 40 },
  heading: { fontSize: 24, fontWeight: 'bold', marginVertical: 16 },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 6,
  },
  inputWithButton: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  checkBtn: {
    backgroundColor: '#F5CBA7',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  checkText: { color: '#333', fontWeight: 'bold' },
  input: {
    width: '100%',
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  dropdownWrapper: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 6,
    overflow: 'hidden',
  },
  dropdown: {
    width: '100%',
  },
  submitBtn: {
    backgroundColor: '#007BFF',
    padding: 14,
    width: '100%',
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backBtn: {
    backgroundColor: '#2ECC71',
    padding: 14,
    width: '100%',
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  success: {
    color: 'green',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
});

export default SignUpScreen;
