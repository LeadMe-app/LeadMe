import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import styles from './styles';
import Logo from '../../components/Logo';
import Sound from '../../icons/sound_icons.svg';
import Micro from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import Play from '../../icons/play_icons.svg';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const WordSentence = ({ navigation, route }) => {
  const { word, wordId } = route.params;
  const [sentence, setSentence] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // 재생 여부 상태
  const [audioFile, setAudioFile] = useState(null); // 녹음된 파일 경로
  const audioRecorderPlayer = new AudioRecorderPlayer();

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

  // useEffect 내부에서는 그대로 사용
  useEffect(() => {
    fetchSentence();
  }, [word]);

  // 녹음 시작/중지
  const [isProcessing, setIsProcessing] = useState(false);

const handleRecordToggle = async () => {
  if (isProcessing) return; // 중복 호출 방지
  setIsProcessing(true);

  try {
    if (isRecording) {
      const result = await audioRecorderPlayer.stopRecorder();
      setAudioFile(result);
      setIsRecording(false);
    } else {
      await audioRecorderPlayer.startRecorder();
      setIsRecording(true);
    }
  } catch (error) {
    console.error('녹음 오류:', error);
    Alert.alert('녹음 오류', '녹음 중 문제가 발생했습니다.');
    setIsRecording(false);
  } finally {
    setIsProcessing(false); // 항상 해제
    }
  };

  // 녹음된 파일 재생
  const handlePlayPress = async () => {
    if (audioFile) {
      if (isPlaying) {
        // 재생 중이면 멈추기
        await audioRecorderPlayer.stopPlayer();
        setIsPlaying(false);
      } else {
        // 재생 시작
        await audioRecorderPlayer.startPlayer(audioFile);
        setIsPlaying(true);
      }
    } else {
      Alert.alert('오류', '녹음된 파일이 없습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={[styles.sentence]}> {sentence || '문장을 불러오는 중...'}</Text> 

      <View style={styles.underline} />

      <TouchableOpacity>
        <Sound width={40} height={40} marginTop={30} />
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <TouchableOpacity onPress={handleRecordToggle}>
          {isRecording
            ? <Stop width={50} height={50} />
            : <Micro width={50} height={50} />}
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
        <TouchableOpacity style={styles.endButton} onPress={() => navigation.navigate('WordScreen', {wordId})}>
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
