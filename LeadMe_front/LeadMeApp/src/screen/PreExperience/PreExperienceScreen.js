import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from '../../components/Logo';
import Microphone from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';

const audioRecorderPlayer = new AudioRecorderPlayer();

const PreExperienceScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [recordedFilePath, setRecordedFilePath] = useState(null);

  useEffect(() => {
    const onBackPress = () => {
      return true;
    };
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, []);

  // 2) 녹음 시작 핸들러
  const handleRecordPress = async () => {
    try {
      // 녹음을 다시 시작하기 전, 이전 결과 초기화
      setFeedback('');
      setSpeechSpeed(null);

      // 상태를 recording 상태로 바꿔 UI 토글
      setIsRecording(true);

      // AudioRecorderPlayer를 이용해 실제 녹음 시작
      const resultPath = await audioRecorderPlayer.startRecorder();
      setRecordedFilePath(resultPath);
      console.log('🌟 녹음 시작:', resultPath);
    } catch (error) {
      console.error('❌ 녹음 시작 실패:', error);
      setIsRecording(false);
    }
  };

  // 3) 녹음 종료 핸들러
  const handleStopPress = async () => {
    try {
      // 녹음 정지
      const resultPath = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      setRecordedFilePath(resultPath);
      console.log('🌟 녹음 종료:', resultPath);

      // 녹음이 끝난 뒤, 서버로 전송 및 분석 요청
      await sendRecordingToServer(resultPath);
    } catch (error) {
      console.error('❌ 녹음 종료 실패:', error);
    }
  };

  // 4) 서버로 녹음 파일 전달하고 결과 받아오기
  const sendRecordingToServer = async (filePath) => {
    try {
      const uri =
        Platform.OS === 'android' ? `file://${filePath}` : filePath;
      const mimeType = 'audio/m4a';
      const fileName = 'pre_experience_recording.m4a';

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: mimeType,
        name: fileName,
      });

      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ 토큰이 없습니다. 로그인 상태를 확인하세요.');
        return;
      }

      // multipart 요청
      const response = await axiosInstance.post(
        '/api/speed/analyze-audio-file/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ 서버 응답:', response.data);
      setSpeechSpeed(response.data.spm);
      setFeedback(
        response.data.feedback ||
          `발화 속도 등급: ${response.data.speed_category}`
      );
    } catch (error) {
      console.error('❌ 서버 업로드/분석 실패:', error);
      if (error.response) {
        console.log('서버 응답 코드:', error.response.status);
        console.log('서버 응답 메시지:', error.response.data);
      } else if (error.request) {
        console.log('요청은 보냈으나 응답 없음:', error.request);
      } else {
        console.log('그 외 오류:', error.message);
      }
    }
  };

  const handleEndExperience = () => {
    navigation.goBack();
  };


  return (
    <View style={styles.container}>
      <Logo />

      {/* 녹음 버튼 영역 */}
      <View style={styles.iconRow}>
        {!isRecording ? (
          <TouchableOpacity
            onPress={handleRecordPress}
            style={styles.buttonArea}
          >
            <Microphone width={100} height={100} />
            <Text style={styles.buttonText}>녹음 시작</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStopPress}
            style={styles.buttonArea}
          >
            <Stop width={100} height={100} />
            <Text style={styles.buttonText}>녹음 정지</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 발화 속도 결과 표시 */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedLabel}>현재 나의 발화속도는?</Text>
        <View style={styles.speedBox}>
          {speechSpeed !== null ? (
            <Text style={styles.speedText}>{`${speechSpeed} WPM`}</Text>
          ) : (
            <Text style={styles.speedPlaceholder}>-</Text>
          )}
        </View>
      </View>

      {/* 서버에서 받은 피드백 텍스트 */}
      {feedback !== '' && (
        <Text style={styles.feedbackText}>{feedback}</Text>
      )}

      {/* 체험 종료 버튼 */}
      <TouchableOpacity
        style={styles.endButton}
        activeOpacity={0.7}
        onPress={handleEndExperience}
      >
        <Text style={styles.endButtonText}>체험 종료</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PreExperienceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  iconRow: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    marginTop: 8,
    fontSize: 16,
    color: '#333',
  },
  speedContainer: {
    width: '80%',
    marginTop: 50,
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: '#FFDDAA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    color: '#333',
  },
  speedBox: {
    marginTop: 12,
    width: '100%',
    height: 120,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  speedPlaceholder: {
    fontSize: 18,
    color: '#AAA',
  },
  feedbackText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  endButton: {
    position: 'absolute',
    bottom: 40,
    width: '80%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
