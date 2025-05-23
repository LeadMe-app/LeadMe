import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
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
  const [ageGroup, setAgeGroup] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [ageGroupError, setAgeGroupError] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const userInfoRes = await axiosInstance.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const {
          user_id,
          username,
          phone_number,
          age_group,
        } = userInfoRes.data;
  
        setUserId(user_id);
        setNickname(username);
        setPhone(phone_number);
        setAgeGroup(age_group);
      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        Alert.alert('오류', '사용자 정보를 불러오지 못했습니다.');
      }
    };
  
    fetchUserInfo();
  }, []);

  const validatePassword = (text) => {
    setPassword(text);
    if (text && text.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
    } else {
      setPasswordError('');
    }
  };

  const validateConfirmPassword = (text) => {
    setConfirmPassword(text);
    if (text && text !== password) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateNickname = (text) => {
    setNickname(text);
    if (text.length < 2) {
      setNicknameError('닉네임은 2자 이상이어야 합니다.');
    } else {
      setNicknameError('');
    }
  };

  const validatePhone = (text) => {
    const clean = text.replace(/[^0-9]/g, '');
    setPhone(clean);
    if (clean.length < 10 && clean.length > 17) {
      setPhoneError('전화번호는 10자리 이상 16자리 이하이어야 합니다.');
    } else {
      setPhoneError('');
    }
  };

  const validateAgeGroup = (value) => {
    setAgeGroup(value);
    if (!value) {
      setAgeGroupError('연령대를 선택해주세요.');
    } else {
      setAgeGroupError('');
    }
  };

  const handleApply = async () => {
    if (!nickname || !phone || !ageGroup) {
      Alert.alert('입력 오류', '모든 정보를 입력해주세요.');
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert('비밀번호 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordError || confirmPasswordError || nicknameError || phoneError || ageGroupError) {
      Alert.alert('입력 오류', '입력 정보를 다시 확인해주세요.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');

      const updateData = {
        username: nickname,
        phone_number: phone,
        age_group: ageGroup,
      };

      if (password) {
        updateData.password = password;
      }

      const response = await axiosInstance.put('/api/users/me', updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { age_group, username} = response.data;
      if (age_group) await AsyncStorage.setItem('age_group', age_group);
      if (username) await AsyncStorage.setItem('username', username);
      
      Alert.alert('수정 완료', '회원정보가 성공적으로 수정되었습니다!');
    } catch (error) {
      console.error('회원정보 수정 실패:', error);
      Alert.alert('오류', '회원정보 수정에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={styles.header}>회원정보수정</Text>

      <TextInput style={styles.input} value={userId} editable={false} />

      <TextInput
        placeholder="비밀번호"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={validatePassword}
      />
      {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

      <TextInput
        placeholder="비밀번호 재확인"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={validateConfirmPassword}
      />
      {confirmPasswordError ? <Text style={styles.error}>{confirmPasswordError}</Text> : null}

      <TextInput
        placeholder="닉네임"
        style={styles.input}
        value={nickname}
        onChangeText={validateNickname}
      />
      {nicknameError ? <Text style={styles.error}>{nicknameError}</Text> : null}

      <TextInput
        placeholder="전화번호"
        style={styles.input}
        value={phone}
        onChangeText={validatePhone}
        keyboardType="phone-pad"
      />
      {phoneError ? <Text style={styles.error}>{phoneError}</Text> : null}

      <Picker
        selectedValue={ageGroup}
        onValueChange={validateAgeGroup}
        style={styles.picker}
      >
        <Picker.Item label="연령대를 선택하세요." value="" enabled={false} />
        <Picker.Item label="어린이: 5 ~ 12세" value="5~12세" />
        <Picker.Item label="청소년: 13세 ~ 19세" value="13~19세" />
        <Picker.Item label="성인: 20세 이상" value="20세 이상" />
      </Picker>
      {ageGroupError ? <Text style={styles.error}>{ageGroupError}</Text> : null}

      <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
        <Text style={styles.applyText}>적용</Text>
      </TouchableOpacity>

      <BackButton />
    </View>
  );
};

export default EditProfileScreen;
