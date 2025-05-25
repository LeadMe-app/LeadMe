import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from './styles';
import Logo from '../../components/Logo';
import Speaker from '../../icons/Speaker_icons.svg';
import Micro from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import Play from '../../icons/play_icons.svg';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import mime from 'mime';

const SentenceSpeech = ({ navigation }) => {
  const [isPracticing, setIsPracticing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sentence, setSentence] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAge, setSelectedAge] = useState('');
  const [recordedPath, setRecordedPath] = useState('');
  const [spm, setSpm] = useState(null);
  const [feedback, setFeedback] = useState('');

  const audioRecorderPlayer = new AudioRecorderPlayer();

  const handlePracticeToggle = async () => {
    if (!isPracticing) {
      try {
        const result = await audioRecorderPlayer.startRecorder();
        audioRecorderPlayer.addRecordBackListener(() => {});
        setRecordedPath(result);
        setIsRecording(true);
        setIsPracticing(true);
      } catch (e) {
        console.error('녹음 시작 실패:', e);
      }
    } else {
      try {
        const result = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        setIsRecording(false);
        setIsPracticing(false);
        setRecordedPath(result);
        await analyzeSpeech(result);
      } catch (e) {
        console.error('녹음 종료 실패:', e);
      }
    }
  };

  const analyzeSpeech = async (filePath) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const uri = Platform.OS === 'android' ? `file://${filePath}` : filePath;
      const mimeType = 'audio/m4a';
      const fileName = 'recoding.m4a'
      console.log('🌐 Base URL:', axiosInstance.defaults.baseURL);
      console.log('📍 Request path:', '/api/speed/analyze-audio-file/');
      console.log('🔗 Expected full URL:', 'http://3.36.186.136:8000/api/speed/analyze-audio-file/')

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: mimeType,
        name: fileName,
      });

      const res = await axiosInstance.post('/api/speed/analyze-audio-file/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSpm(res.data.spm);
      setFeedback(res.data.speed_category);
    } catch (error) {
      console.log('❌ 실제 요청 URL:', error.config?.url);
      console.log('❌ 요청 method:', error.config?.method);
      console.log('❌ baseURL:', error.config?.baseURL); 
      console.log('❌ 상태 코드:', error.response?.status);
      console.error('분석 오류 전체:', error);

      Alert.alert('오류', '녹음 분석에 실패했습니다.');
    }
  };

  const handlePlayPress = async () => {
    if (recordedPath) {
      const path = Platform.OS === 'android'
        ? recordedPath.replace('file://', '')
        : recordedPath;
      console.log('재생할 경로', path);

      const sound = new Sound(path, '', (error) => {
        if (error){
          console.log('재생 초기화 실패', error);
          return;
        }
        sound.play((success) => {
          if (success) {
            console.log('재생 완료');
          } else {
            console.log('재생 중 오류 발생');
          }
        });
      });
    }
  };

  // 📜 문장 불러오기
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
      const age = selectedAge || await AsyncStorage.getItem('age_group');

      const params = new URLSearchParams({
        text: sentence,
        user_id: userId,
        speaker: 'Seoyeon',
        speed: '중간',
        age_group: age,
      });

      const response = await axiosInstance.post(
        `/api/tts/text-to-speech/?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { file_url } = response.data;
      if (!file_url) {
        Alert.alert('오류', '음성 파일 경로를 받아오지 못했습니다.');
        return;
      }

      const fullUrl = `${axiosInstance.defaults.baseURL}${file_url}`;
      const sound = new Sound(fullUrl, null, (error) => {
        if (error) {
          console.error('TTS 로딩 실패:', error);
          Alert.alert('오류', 'TTS 재생 실패');
          return;
        }
        sound.play(() => sound.release());
      });
    } catch (error) {
      console.error('TTS 오류:', error);
      Alert.alert('TTS 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchSentence();
  }, []);

  // 🎨 SPM 컬러 결정
  const sentenceColor = spm == null
    ? '#000'
    : spm < 180
      ? 'blue'
      : spm > 300
        ? 'red'
        : 'green';

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={[styles.sentence, { color: sentenceColor }]}>
        {sentence || '문장을 불러오는 중...'}
      </Text>
      {spm && <Text style={styles.feedbackText}>속도: {spm}spm / 평가: {feedback}</Text>}
      <View style={styles.underline} />

      <View style={styles.topRow}>
        <TouchableOpacity onPress={requestTTSAndPlay} disabled={isProcessing}>
          <Speaker width={40} height={40} />
        </TouchableOpacity>

        <Picker
          selectedValue={selectedAge}
          onValueChange={(value) => setSelectedAge(value)}
          mode="dropdown"
          style={{
          ...styles.dropdown,
          color: '#000',
          fontFamily: undefined,
          }}
          itemStyle={{color: '#000'}}
        >
          <Picker.Item label="원하는 속도를 선택하세요" value="" />
          <Picker.Item label="5~12세" value="5~12세" />
          <Picker.Item label="13~19세" value="13~19세" />
          <Picker.Item label="20세 이상" value="20세 이상" />
        </Picker>
      </View>

      <TouchableOpacity
        style={isPracticing ? styles.stopButton : styles.startButton}
        onPress={handlePracticeToggle}
      >
        <Text style={styles.practiceButtonText}>
          {isPracticing ? '연습 종료' : '연습 시작'}
        </Text>
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <TouchableOpacity disabled>
          {isRecording ? <Stop width={50} height={50} /> : <Micro width={50} height={50} />}
          <Text style={styles.iconLabel}>
            {isRecording ? '녹음중' : '녹음'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayPress} style={styles.iconWithLabel}>
          <Play width={50} height={50} />
          <Text style={styles.iconLabel}>재생</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.endButton}
          onPress={() => navigation.navigate('SelectSpeechTypeScreen')}
        >
          <Text style={styles.bottomButtonText}>치료 종료</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.otherButton}
          onPress={fetchSentence}
        >
          <Text style={styles.bottomButtonText}>다른 문장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SentenceSpeech;
