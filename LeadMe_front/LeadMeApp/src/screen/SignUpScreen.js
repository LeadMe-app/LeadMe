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
//import axios from 'axios';
import BackButton from '../components/BackButton';
import axiosInstance from '../config/axiosInstance';
import SignUpSuccessModal from './SignUpSuccessModal';

const SignUpScreen = ({navigation}) => {
  const [userId, setUserId] = useState('');
  const [idChecked, setIdChecked] = useState(null); // null, true, false
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({
    userId: '',
    password: '',
    general: '',
  });

  {/* 아이디 중복확인 */}
  const checkIdDuplicate = async () => {
    if (!userId.trim()) {
      setErrors((prev) => ({ ...prev, userId: '아이디를 입력해주세요.' }));
      return;
    }
  
    try {
      const response = await axiosInstance.post('/api/auth/check-username', {
        username: userId.trim() 
      });
  
      if (response.data.available === false) {
        setIdChecked(false);
        setErrors((prev) => ({ ...prev, userId: '이미 존재하는 아이디입니다.' }));
      } else {
        setIdChecked(true);
        setErrors((prev) => ({ ...prev, userId: '' }));
      }
    } catch (error) {
      console.error('아이디 중복 확인 에러:', error);
      setErrors((prev) => ({
        ...prev,
        userId: '아이디 중복 확인 중 오류가 발생했습니다.',
      }));
    }
  };

  {/*회원가입 시도 */}
  const handleSubmit = async () => {
    let valid = true;
    let newErrors = { userId: '', password: '', general: '' };

    if (!userId || !password || !confirmPw || !nickname || !phone || !age) {
      newErrors.general = '모든 정보를 입력해주세요.';
      valid = false;
    }

    if (!idChecked) {
      newErrors.userId = '아이디 중복 확인을 해주세요.';
      valid = false;
    }

    if (password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
      valid = false;
    }    

    if (confirmPw && password !== confirmPw) {
      newErrors.password = '비밀번호가 일치하지 않습니다.';
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      try {
        const res = await axiosInstance.post('/api/auth/register', {
          username: userId,
          password: password,
          password_confirm : confirmPw, //검증 위해서 필요
          phone_number: phone,
          nickname : nickname,
          age_group: age,
        },
        {
          headers: {
            'Content-Type': 'application/json', 
          },
        }
      );
        
        console.log('회원가입 성공:', res.data);
        //navigation.navigate('SignUpSuccess', {nickname}); // 모달로 바꾸면 좋을 것 같아요!
        setShowSuccess(true);
      }catch (err) {
        //console.error(err.response?.data || err);
        console.log("에러 응답:", err.response?.data);
        setErrors((prev) => ({
          ...prev,
          general: '회원가입에 실패하였습니다. 입력 내용을 다시 한 번 확인해주세요.',
        }));
      }
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
          //onChangeText={setUserId}
          onChangeText={(text) => {
            setUserId(text);
            setIdChecked(null); // 아이디 바뀌면 중복확인 초기화
          }}
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

      {/* 비밀번호 입력 */}
      <TextInput
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (text.length < 8) {
            setErrors((prev) => ({
              ...prev,
              password: '비밀번호는 8자 이상이어야 합니다.',
            }));
          } else {
            setErrors((prev) => ({ ...prev, password: '' }));
          }

          if (confirmPw && text !== confirmPw) {
            setErrors((prev) => ({
              ...prev,
              confirmPw: '비밀번호가 일치하지 않습니다.',
            }));
          } else {
            setErrors((prev) => ({ ...prev, confirmPw: '' }));
          }
        }}
        style={styles.input}
      />
      {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

      {/* 비밀번호 재확인 */}
      <TextInput
        placeholder="비밀번호 재확인"
        secureTextEntry
        value={confirmPw}
        onChangeText={(text) => {
          setConfirmPw(text);
          if (text !== password) {
            setErrors((prev) => ({
              ...prev,
              confirmPw: '비밀번호가 일치하지 않습니다.',
            }));
          } else {
            setErrors((prev) => ({ ...prev, confirmPw: '' }));
          }
        }}
        style={styles.input}
      />
      {errors.confirmPw ? <Text style={styles.error}>{errors.confirmPw}</Text> : null}

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
        onChangeText={(text) => {
          const onlyNums = text.replace(/[^0-9]/g, '');
          setPhone(onlyNums);
          if (!onlyNums) {
            setErrors((prev) => ({ ...prev, phone: '전화번호를 입력해주세요.' }));
          } else {
            setErrors((prev) => ({ ...prev, phone: '' }));
          }
        }}
        keyboardType="phone-pad"
        style={styles.input}
      />
      {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

      {/* 연령대 선택 */}
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={age}
          onValueChange={(itemValue) => {
            setAge(itemValue);
            if (!itemValue) {
              setErrors((prev) => ({ ...prev, age: '연령대를 선택해주세요.' }));
            } else {
              setErrors((prev) => ({ ...prev, age: '' }));
            }
          }}
          style={styles.dropdown}
        >
          <Picker.Item label="연령대를 선택하세요." value="" enabled={false} />
          <Picker.Item label="어린이: 5 ~ 12세" value="5~12세" />
          <Picker.Item label="청소년: 13세 ~ 19세" value="13~19세" />
          <Picker.Item label="성인: 20세 이상" value="20세 이상" />
        </Picker>
      </View>
      {errors.age ? <Text style={styles.error}>{errors.age}</Text> : null}

      {/* 전체 오류 메시지 */}
      {errors.general ? <Text style={styles.error}>{errors.general}</Text> : null}

      {/* 회원가입 버튼 */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>회원가입</Text>
      </TouchableOpacity>

      {/* 뒤로가기 버튼 */}
      <BackButton />
      {/*SignUpSuccessModal 추가 부분*/}
      <SignUpSuccessModal
      visible = {showSuccess}
      onClose = {() => {
        setShowSuccess(false);
        navigation.navigate('Login');

      }}
      nickname = {nickname}
      />
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
