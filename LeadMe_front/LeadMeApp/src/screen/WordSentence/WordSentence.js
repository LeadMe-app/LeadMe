import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, NativeModules } from 'react-native';
import styles from './styles';
import Logo from '../../components/Logo';
import Sound from '../../icons/sound_icons.svg';
import Micro from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { DAFModule } = NativeModules;

const WordSentence = ({ navigation, route }) => {
  const { word, wordId } = route.params;
  const [sentence, setSentence] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDAFRunning, setIsDAFRunning] = useState(false);

  const fetchSentence = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('access_token');

      const response = await axiosInstance.post(
        '/api/sentence/generate/word',
        { user_id: userId, word },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.sentence) {
        setSentence(response.data.sentence);
      } else {
        Alert.alert('문장 생성 실패', '적절한 문장을 받아오지 못했습니다.');
      }
    } catch (error) {
      console.error('문장 가져오기 실패:', error);
      Alert.alert('오류', '문장을 불러오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchSentence();
  }, [word]);

  const toggleDAF = () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      if (isDAFRunning) {
        DAFModule.stopDAF();
        setIsDAFRunning(false);
      } else {
        DAFModule.startDAF();
        setIsDAFRunning(true);
      }
    } catch (error) {
      console.error('DAF 토글 오류:', error);
      Alert.alert('오류', 'DAF 기능 실행 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={[styles.sentence]}>
        {sentence || '문장을 불러오는 중...'}
      </Text>

      <View style={styles.underline} />

      <TouchableOpacity>
        <Sound width={40} height={40} marginTop={30} />
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <TouchableOpacity onPress={toggleDAF} style={styles.iconWithLabel}>
          {isDAFRunning ? (
            <Stop width={50} height={50} />
          ) : (
            <Micro width={50} height={50} />
          )}
          <Text style={styles.iconLabel}>
            {isDAFRunning ? 'DAF 중지' : 'DAF 시작'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.endButton} onPress={() => navigation.navigate('WordScreen', { wordId })}>
          <Text style={styles.bottomButtonText}>문장연습 종료</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.otherButton} onPress={fetchSentence}>
          <Text style={styles.bottomButtonText}>다른 문장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WordSentence;
