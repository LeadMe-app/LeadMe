import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import styles from './styles';
import Logo from '../../components/Logo';
import Speaker from '../../icons/Speaker_icons.svg';
import Micro from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import Play from '../../icons/play_icons.svg';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';

const SentenceSpeech = ({navigation}) => {
  const [isPracticing, setIsPracticing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sentence, setSentence] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePracticeToggle = () => {
    setIsPracticing(prev => !prev);
  };

  const handleRecordToggle = () => {
    setIsRecording(prev => !prev);
    // TODO: 실제 녹음 start/stop 로직 연결
  };

  const handlePlayPress = () => {
    // TODO: 녹음된 파일 재생 로직 연결
  };

  const fetchSentence = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axiosInstance.post('/api/sentence/generate', {
        user_id: userId,
      });

      if (response.data.sentence) {
        setSentence(response.data.sentence);
      } else {
        Alert.alert('오류', '문장을 불러오지 못했습니다.');
      }
    } catch (error) {
      console.error('문장 불러오기 오류:', error);
      Alert.alert('오류', '문장을 불러오는 중 문제가 발생했습니다.');
    }
  };
  
  const requestTTSAndPlay = async () => {
    try {
      setIsProcessing(true);

      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('access_token');
      const age = await AsyncStorage.getItem('age_group');
      const params = new URLSearchParams({
        text: sentence,
        user_id: userId,
        speaker: 'Seoyeon',
        speed: '중간',
        age_group: age,
      });

      const response = await axiosInstance.post(`/api/tts/text-to-speech/?${params.toString()}`, {},
        {
          headers: { Authorization: `Bearer ${token}`, },
        }
      );
      
      console.log('TTS 응답 데이터:', response.data);
      const { file_url } = response.data;
      const fullUrl = `${axiosInstance.defaults.baseURL}${file_url}`;

      if (!file_url) {
        Alert.alert('오류', '음성 파일 경로를 받아오지 못했습니다.');
        return;
      }

      const sound = new Sound(fullUrl, null, (error) => {
        if (error) {
          console.error('음성 로딩 실패:', error);
          Alert.alert('오류', '음성을 재생할 수 없습니다.');
          return;
        }

        sound.play((success) => {
          if (!success) {
            console.error('음성 재생 실패');
          }
          sound.release();
        });
      });

    } catch (error) {
      console.error('TTS 요청 실패:', error);
      console.error('상세 에러:', JSON.stringify(error, null, 2));
      Alert.alert('오류', 'TTS 요청 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => { // 화면 진입 시 문장 자동 불러오기
    fetchSentence();
  }, []);

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={[styles.sentence]}> 
        {sentence || '문장을 불러오는 중...'}
      </Text> 
      
      <View style={styles.underline} />

      <View style={styles.topRow}>
        <TouchableOpacity onPress={requestTTSAndPlay}>
          <Speaker width={40} height={40} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={styles.dropdownText}>원하는 속도를 선택하세요</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={isPracticing ? styles.stopButton : styles.startButton}
        onPress={handlePracticeToggle}
      >
        <Text style={styles.practiceButtonText}>
          {isPracticing ? '연습 종료' : '연습 시작'}
        </Text>
      </TouchableOpacity>

      {/* 녹음 & 재생 아이콘 */}
      <View style={styles.iconRow}>
        <TouchableOpacity onPress={handleRecordToggle}  >
          {isRecording
            ? <Stop width={50} height={50} />
            : <Micro width={50} height={50} />
          }
          <Text style={styles.iconLabel}>
            {isRecording ? '중지' : '녹음'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPress} style={styles.iconWithLabel}>
          <Play width={50} height={50} />
          <Text style={styles.iconLabel}>재생</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.endButton} onPress={() => navigation.navigate('SelectSpeechTypeScreen')}>
          <Text style={styles.bottomButtonText}>치료 종료</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.otherButton} onPress={fetchSentence}>
          <Text style={styles.bottomButtonText}>다른 문장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SentenceSpeech;
