import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import BackButton from '../../components/BackButton';
import axiosInstance from '../../config/axiosInstance';
import SignUpSuccessModal from '../../components/SignUpSuccessModal';
import { styles } from './styles';
import Logo from '../../components/Logo';

const SignUpScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [idChecked, setIdChecked] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneChecked, setPhoneChecked] = useState(null);
  const [age, setAge] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [errors, setErrors] = useState({
    userId: '',
    password: '',
    confirmPw: '',
    nickname: '',
    phone: '',
    age: '',
    general: '',
  });

  const checkIdDuplicate = async () => {
    if (!userId.trim()) {
      setErrors((prev) => ({ ...prev, userId: '아이디를 입력해주세요.' }));
      return;
    }

    try {
      const response = await axiosInstance.post('/api/auth/check-userid', {
        user_id: userId.trim(),
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

  const checkPhoneDuplicate = async () => {
    if (!phone.trim()) {
      setErrors((prev) => ({ ...prev, phone: '전화번호를 입력해주세요.' }));
      return;
    }

    try {
      const response = await axiosInstance.post('/api/auth/check-phone-number', {
        phone_number: phone.trim(),
      });

      if (response.data.available === false) {
        setPhoneChecked(false);
        setErrors((prev) => ({ ...prev, phone: '이미 등록된 전화번호입니다.' }));
      } else {
        setPhoneChecked(true);
        setErrors((prev) => ({ ...prev, phone: '' }));
      }
    } catch (error) {
      console.error('전화번호 중복 확인 에러:', error);
      setErrors((prev) => ({
        ...prev,
        phone: '전화번호 중복 확인 중 오류가 발생했습니다.',
      }));
    }
  };

  const handleSubmit = async () => {
    // 필수 정보 누락만 검사
    if (!userId || !password || !confirmPw || !nickname || !phone || !age) {
      setErrors((prev) => ({ ...prev, general: '모든 정보를 입력해주세요.' }));
      return;
    }

    if (!idChecked) {
      setErrors((prev) => ({ ...prev, userId: '아이디 중복 확인을 해주세요.' }));
      return;
    }

    if (!phoneChecked) {
      setErrors((prev) => ({ ...prev, phone: '전화번호 중복 확인을 해주세요.' }));
      return;
    }

    try {
      const res = await axiosInstance.post(
        '/api/auth/register',
        {
          user_id: userId,
          username: nickname,
          password,
          password_confirm: confirmPw,
          phone_number: phone,
          age_group: age,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('회원가입 성공:', res.data);
      setModalVisible(true);
    } catch (err) {
      console.error('회원가입 에러:', err.response?.data || err.message);
      setErrors((prev) => ({
        ...prev,
        general: '회원가입에 실패하였습니다. 입력 내용을 다시 한 번 확인해주세요.',
      }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
        >
          <Logo />
          <Text style={styles.heading}>회원가입</Text>

          {/* 아이디 입력 */}
          <View style={styles.row}>
            <TextInput
              placeholder="아이디"
              value={userId}
              onChangeText={(text) => {
                setUserId(text);
                setIdChecked(null);
                setErrors((prev) => ({
                  ...prev,
                  userId:
                    text.length < 3 || text.length > 50
                      ? '아이디는 3자 이상 50자 이하로 입력해주세요.' : '',
                      
                }));
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

          {/* 비밀번호 */}
          <TextInput
            placeholder="비밀번호"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({
                ...prev,
                password: text.length < 8 ? '비밀번호는 8자 이상이어야 합니다.' : '',
              }));
            }}
            style={styles.input}
          />
          {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

          {/* 비밀번호 확인 */}
          <TextInput
            placeholder="비밀번호 재확인"
            secureTextEntry
            value={confirmPw}
            onChangeText={(text) => {
              setConfirmPw(text);
              setErrors((prev) => ({
                ...prev,
                confirmPw: text !== password ? '비밀번호가 일치하지 않습니다.' : '',
              }));
            }}
            style={styles.input}
          />
          {errors.confirmPw ? <Text style={styles.error}>{errors.confirmPw}</Text> : null}

          {/* 닉네임 */}
          <TextInput
            placeholder="닉네임"
            value={nickname}
            onChangeText={(text) => {
              setNickname(text);
              setErrors((prev) => ({
                ...prev,
                nickname:
                  text.length < 2 || text.length > 50
                    ? '닉네임은 2자 이상 50자 이하로 입력해주세요.'
                    : '',
              }));
            }}
            style={styles.input}
          />
          {errors.nickname ? <Text style={styles.error}>{errors.nickname}</Text> : null}

          {/* 전화번호 */}
          <View style={styles.row}>
            <TextInput
              placeholder="전화번호"
              value={phone}
              onChangeText={(text) => {
                const onlyNums = text.replace(/[^0-9]/g, '');
                setPhone(onlyNums);
                setPhoneChecked(null);
                if (!onlyNums.startsWith('01')) {
                  setErrors((prev) => ({ ...prev, phone: '전화번호는 01로 시작해야 합니다.' }));
                } else if (onlyNums.length !== 10 && onlyNums.length !== 11) {
                  setErrors((prev) => ({ ...prev, phone: '전화번호는 10자리 또는 11자리여야 합니다.' }));
                } else {
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }
              }}
              keyboardType="phone-pad"
              style={styles.inputWithButton}
            />
            <TouchableOpacity style={styles.checkBtn} onPress={checkPhoneDuplicate}>
              <Text style={styles.checkText}>중복확인</Text>
            </TouchableOpacity>
          </View>
          {errors.phone ? (
            <Text style={styles.error}>{errors.phone}</Text>
          ) : phoneChecked === true ? (
            <Text style={styles.success}>사용 가능한 전화번호입니다.</Text>
          ) : null}

          {/* 연령대 */}
          <View style={styles.dropdownWrapper}>
            <Picker
              selectedValue={age}
              onValueChange={(value) => {
                setAge(value);
                setErrors((prev) => ({
                  ...prev,
                  age: value ? '' : '연령대를 선택해주세요.',
                }));
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

          {/* 일반 에러 메시지 */}
          {errors.general ? <Text style={styles.error}>{errors.general}</Text> : null}

          {/* 회원가입 버튼 */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>회원가입</Text>
          </TouchableOpacity>

          {/* 성공 모달 */}
          <SignUpSuccessModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              navigation.navigate('Login');
            }}
            nickname={nickname}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BackButton은 절대 위치로 하단 고정 */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          alignItems : 'center',
          backgroundColor: 'white',
          padding: 20,
          borderTopWidth: 1,
          borderColor: '#ddd',
        }}
      >
        <BackButton />
      </View>
    </View>
  );
};

export default SignUpScreen;
