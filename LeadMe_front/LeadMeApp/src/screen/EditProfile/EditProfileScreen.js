import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../config/axiosInstance';
import BackButton from '../../components/BackButton';
import { styles } from './styles';
import Logo from '../../components/Logo';

const EditProfileScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneChecked, setPhoneChecked] = useState(null);
  const [ageGroup, setAgeGroup] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    nickname: '',
    phone: '',
    ageGroup: '',
    general: '',
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const res = await axiosInstance.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { user_id, username, phone_number, age_group } = res.data;

        setUserId(user_id);
        setNickname(username);
        setPhone(phone_number);
        setOriginalPhone(phone_number);
        setAgeGroup(age_group);
        setPhoneChecked(true); // 기존 번호이므로 중복 체크 통과 처리
      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        Alert.alert('오류', '사용자 정보를 불러오지 못했습니다.');
      }
    };
    fetchUserInfo();
  }, []);

  const validatePassword = (text) => {
    setPassword(text);
    setErrors((prev) => ({
      ...prev,
      password: text && text.length < 8 ? '비밀번호는 8자 이상이어야 합니다.' : '',
      confirmPassword:
        confirmPassword && text !== confirmPassword ? '비밀번호가 일치하지 않습니다.' : prev.confirmPassword,
    }));
  };

  const validateConfirmPassword = (text) => {
    setConfirmPassword(text);
    setErrors((prev) => ({
      ...prev,
      confirmPassword: text !== password ? '비밀번호가 일치하지 않습니다.' : '',
    }));
  };

  const validateNickname = (text) => {
    setNickname(text);
    setErrors((prev) => ({
      ...prev,
      nickname: text.length < 2 ? '닉네임은 2자 이상이어야 합니다.' : '',
    }));
  };

  const validateAgeGroup = (value) => {
    setAgeGroup(value);
    setErrors((prev) => ({
      ...prev,
      ageGroup: !value ? '연령대를 선택해주세요.' : '',
    }));
  };

  const checkPhoneDuplicate = async () => {
    if (!phone) {
      setErrors((prev) => ({ ...prev, phone: '전화번호를 입력해주세요.' }));
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axiosInstance.post(
        '/api/auth/login-check-phone-number',
        { phone_number: phone.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data.available) {
        setPhoneChecked(false);
        setErrors((prev) => ({ ...prev, phone: response.data.message || '이미 등록된 전화번호입니다.' }));
      } else {
        setPhoneChecked(true);
        setErrors((prev) => ({ ...prev, phone: '' }));
      }
    } catch (error) {
      console.error('전화번호 중복 확인 에러:', error);
      setPhoneChecked(false);
      setErrors((prev) => ({
        ...prev,
        phone: '전화번호 중복 확인 중 오류가 발생했습니다.',
      }));
    }
  };

  const handleApply = async () => {
    // 기본 입력 확인
    if (!nickname || !phone || !ageGroup) {
      setErrors((prev) => ({ ...prev, general: '모든 정보를 입력해주세요.' }));
      Alert.alert('입력 오류', '모든 정보를 입력해주세요.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, general: '비밀번호가 일치하지 않습니다.' }));
      Alert.alert('비밀번호 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    // 각 필드 에러 확인
    if (Object.values(errors).some((e) => e)) {
      Alert.alert('입력 오류', '입력 정보를 다시 확인해주세요.');
      return;
    }

    if (phone !== originalPhone && phoneChecked !== true) {
      Alert.alert('중복 확인 필요', '전화번호 중복 확인을 해주세요.');
      return;
    }


    try {
      const token = await AsyncStorage.getItem('access_token');

      const updateData = {
        username: nickname,
        phone_number: phone,
        age_group: ageGroup,
      };
      if (password && password.trim().length > 0) {
        updateData.password = password;
      }
      const response = await axiosInstance.put('/api/users/me', updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { age_group, username } = response.data;
      if (age_group) await AsyncStorage.setItem('age_group', age_group);
      if (username) await AsyncStorage.setItem('username', username);

      if (password) {
        Alert.alert('수정 완료', '비밀번호가 변경되어 자동 로그아웃됩니다.');
        setTimeout(async () => {
          await AsyncStorage.removeItem('access_token');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }, 500);
      } else {
        Alert.alert('수정 완료', '회원정보가 성공적으로 수정되었습니다!');
      }
    } catch (error) {
      console.error('회원정보 수정 실패:', error);
      Alert.alert('오류', '회원정보 수정에 실패했습니다.');
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
       contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
       keyboardShouldPersistTaps="handled"
       >
        <Logo />
        <Text style={styles.header}>회원정보 수정</Text>

        {/* 아이디 (읽기전용) */}
        <TextInput style={styles.input} value={userId} editable={false} />

        {/* 비밀번호 */}
          <TextInput
            placeholder="비밀번호"
            secureTextEntry
            value={password}
            onChangeText={validatePassword}
            style={styles.input}
          />
          {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

          {/* 비밀번호 확인 */}
          <TextInput
            placeholder="비밀번호 재확인"
            secureTextEntry
            value={confirmPassword}
            onChangeText={validateConfirmPassword}
            style={styles.input}
          />
          {errors.confirmPassword ? <Text style={styles.error}>{errors.confirmPassword}</Text> : null}

          {/* 닉네임 */}
          <TextInput
            placeholder="닉네임"
            value={nickname}
            onChangeText={validateNickname}
            style={styles.input}
          />
          {errors.nickname ? <Text style={styles.error}>{errors.nickname}</Text> : null}

          {/* 전화번호 + 중복확인 */}
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
          ) : phoneChecked === true && phone !== originalPhone ? (
            <Text style={styles.success}>사용 가능한 전화번호입니다.</Text>
          ) : null}

          {/* 연령대 */}
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={ageGroup} onValueChange={validateAgeGroup} style={styles.picker}>
              <Picker.Item label="연령대를 선택하세요." value="" enabled={false} />
              <Picker.Item label="어린이: 5 ~ 12세" value="5~12세" />
              <Picker.Item label="청소년: 13세 ~ 19세" value="13~19세" />
              <Picker.Item label="성인: 20세 이상" value="20세 이상" />
            </Picker>
          </View>
          {errors.ageGroup ? <Text style={styles.error}>{errors.ageGroup}</Text> : null}

          {/* 일반 에러 */}
          {errors.general ? <Text style={styles.error}>{errors.general}</Text> : null}

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>적용</Text>
          </TouchableOpacity>

          <BackButton />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

};

export default EditProfileScreen;
