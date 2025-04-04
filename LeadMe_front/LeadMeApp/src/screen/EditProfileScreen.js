import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import BackButton from '../components/BackButton';

const EditProfileScreen = ({ navigation }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('홍길동');
  const [ageGroup, setAgeGroup] = useState('');

  const handleApply = () => {
    if (!password || !confirmPassword || !nickname || !ageGroup) {
      Alert.alert('입력 오류', '모든 정보를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('비밀번호 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    Alert.alert('수정 완료', '수정되었습니다!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LEAD ME</Text>
      <Text style={styles.header}>회원정보수정</Text>

      <TextInput style={styles.input} value="Test (수정불가)" editable={false} />
      <TextInput
        placeholder="비밀번호"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="비밀번호 재확인"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TextInput
        placeholder="닉네임"
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
      />
      <TextInput
        placeholder="전화번호: 010-0000-0000"
        style={styles.input}
        editable={false}
      />

      <Picker
        selectedValue={ageGroup}
        onValueChange={(itemValue) => setAgeGroup(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="연령대를 선택하세요." value="" />
        <Picker.Item label="3~6세" value="3-6" />
        <Picker.Item label="7~9세" value="7-9" />
        <Picker.Item label="10~12세" value="10-12" />
      </Picker>

      <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
        <Text style={styles.applyText}>적용</Text>
      </TouchableOpacity>

      <BackButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF0DC',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A38BFE',
    marginBottom: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    backgroundColor: '#f1f1f1',
    marginBottom: 16,
  },
  picker: {
    width: '100%',
    height: 50,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  applyBtn: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  applyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;