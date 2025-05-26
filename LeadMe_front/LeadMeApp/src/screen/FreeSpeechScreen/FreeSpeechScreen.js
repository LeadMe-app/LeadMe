import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import axiosInstance from '../../config/axiosInstance';
import { styles } from './styles';
import Logo from '../../components/Logo';
import BackButton from '../../components/BackButton';
import Microphone from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import Scound from '../../icons/sound_icons.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const audioRecorderPlayer = new AudioRecorderPlayer();

const FreeSpeechScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [recordedFilePath, setRecordedFilePath] = useState(null);

  const handleRecordPress = async () => {
    setIsRecording(true);
    const result = await audioRecorderPlayer.startRecorder();
    setRecordedFilePath(result);
    console.log('녹음 시작:', result); // 눌렀을때 속도, 피드백 초기화
  };

  const handleStopPress = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    setIsRecording(false);
    console.log('녹음 종료:', result);
    setRecordedFilePath(result);
    await sendRecordingToServer(result);
  };

  const sendRecordingToServer = async (filePath) => {
    try {
      const uri = Platform.OS === 'android' ? `file://${filePath}` : filePath;
      const mimeType = 'audio/m4a';
      const fileName = 'recording.m4a';

      console.log('업로드 준비');
      console.log('filePath:', filePath);
      console.log('uri:', uri);
      console.log('fileName:', fileName);
      console.log('mimeType:', mimeType);

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: mimeType,
        name: fileName,
      });

      const token = await AsyncStorage.getItem('access_token');

      const response = await axiosInstance.post('/api/speed/analyze-audio-file/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('서버 응답:', response.data);
      setSpeechSpeed(response.data.spm);
      setFeedback(response.data.feedback || `발화 속도 등급 ${response.data.speed_category}`);
    } catch (error) {
      console.error('서버 업로드 실패:', error);

      if (error.response) {
        console.log('서버 응답 코드:', error.response.status);
        console.log('서버 응답 메시지:', error.response.data);
      } else if (error.request) {
        console.log('요청 전송은 됐으나 응답 없음:', error.request);
      } else {
        console.log('오류 발생:', error.message);
      }
    }
  };

  const handlePlayPress = async () => {
    if (recordedFilePath) {
      // Android에서 file:// 제거 (Sound 라이브러리가 인식 못함)
      const path = Platform.OS === 'android'
        ? recordedFilePath.replace('file://', '')
        : recordedFilePath;

      console.log('재생할 경로:', path);

      const sound = new Sound(path, '', (error) => {
        if (error) {
          console.error('재생 초기화 실패:', error);
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

  return (
    <View style={styles.container}>
      <Logo />

      <View style={styles.iconRow}>
        {!isRecording ? (
          <>
            <TouchableOpacity onPress={handleRecordPress}>
              <Microphone width={70} height={70} />
              <Text style={styles.iconText}>녹음</Text>
            </TouchableOpacity>

            {recordedFilePath && (
              <TouchableOpacity onPress={handlePlayPress}>
                <Scound width={80} height={80} />
                <Text style={styles.iconText}>재생</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity onPress={handleStopPress}>
            <Stop width={80} height={80} />
            <Text style={styles.iconText}>정지</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.resultTitle}>현재 나의 발화속도는?</Text>
        <Text style={styles.resultContent}>
          {speechSpeed ? `${speechSpeed} 입니다.` : ''}
        </Text>
      </View>

      {feedback !== '' && <Text style={styles.feedbackText}>{feedback}</Text>}

      <BackButton />
    </View>
  );
};

export default FreeSpeechScreen;
