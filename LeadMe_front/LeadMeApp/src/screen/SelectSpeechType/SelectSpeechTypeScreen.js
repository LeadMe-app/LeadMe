import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import Logo from '../../components/Logo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../config/axiosInstance';

const SelectSpeechTypeScreen = ({ navigation }) => {
  const handleGoBack = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const res = await axiosInstance.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const username = res.data.username;
        navigation.navigate('HomeScreen');
      } else {
        console.warn('토큰이 없습니다.');
      }
    } catch (error) {
      console.error('사용자 정보를 불러오지 못했습니다:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Logo />

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#FFD8A9' }]}
        onPress={() => navigation.navigate('FreeSpeechScreen')}
      >
        <Text style={styles.optionTitle}>직접 발화</Text>
        <Text style={styles.optionSubtitle}>자유롭게 말합니다. 속도 분석 기능 제공</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#A9D6FD' }]}
        onPress={() => navigation.navigate('SentenceSpeech')}
      >
        <Text style={styles.optionTitle}>문장 발화</Text>
        <Text style={styles.optionSubtitle}>제공된 문장을 따라 읽습니다. 발화 속도 조절 연습</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#D6C3FF' }]}
        onPress={() => navigation.navigate('HyperScreen')}
      >
        <Text style={styles.optionTitle}>음성 피로도 분석</Text>
        <Text style={styles.optionSubtitle}>최소 1분 이상의 발화를 필요로 합니다.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
        <Text style={styles.backText}>뒤로 가기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SelectSpeechTypeScreen;
