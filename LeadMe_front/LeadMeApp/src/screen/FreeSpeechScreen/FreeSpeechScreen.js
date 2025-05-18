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
import mime from 'mime';

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
    console.log('🎙️ 녹음 시작:', result);
  };

  const handleStopPress = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    setIsRecording(false);
    console.log('🛑 녹음 종료:', result);
    await sendRecordingToServer(result);
  };

  const sendRecordingToServer = async (filePath) => {
    try {
      const uri = Platform.OS === 'android' ? filePath : filePath;
      const ext = filePath.includes('.') ? filePath.split('.').pop() : 'm4a';
      const mimeType = mime.getType(filePath);
      const fileName = `recording.${ext}`;

      console.log('📤 업로드 준비');
      console.log('📁 filePath:', filePath);
      console.log('📁 uri:', uri);
      console.log('📁 fileName:', fileName);
      console.log('📁 mimeType:', mimeType);

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: mimeType || 'audio/m4a',
        name: fileName,
      });

      const token = await AsyncStorage.getItem('access_token');

      const response = await axiosInstance.post('/api/speed/analyze-audio-file/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('✅ 서버 응답:', response.data);
      setSpeechSpeed(response.data.spm);
      setFeedback(response.data.feedback);

    } catch (error) {
      console.error('❌ 서버 업로드 실패:', error);

      if (error.response) {
        console.log('📛 서버 응답 코드:', error.response.status);
        console.log('📛 서버 응답 메시지:', error.response.data);
      } else if (error.request) {
        console.log('📛 요청 전송은 됐으나 응답 없음:', error.request);
      } else {
        console.log('📛 오류 발생:', error.message);
      }
    }
  };

  const handlePlayPress = async () => {
    if (recordedFilePath) {
      const sound = new Sound(recordedFilePath, '', (error) => {
        if (error) {
          console.error('재생 실패:', error);
          return;
        }
        sound.play();
      });
    }
  };

  return (
    <View style={styles.container}>
      <Logo />

      <View style={styles.iconRow}>
        {!isRecording ? (
          <TouchableOpacity onPress={handleRecordPress}>
            <Microphone width={70} height={70} />
            <Text style={styles.iconText}>녹음</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={handleStopPress}>
              <Stop width={80} height={80} />
              <Text style={styles.iconText}>녹음</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPress}>
              <Scound width={80} height={80} />
              <Text style={styles.iconText}>재생</Text>
            </TouchableOpacity>
          </>
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
