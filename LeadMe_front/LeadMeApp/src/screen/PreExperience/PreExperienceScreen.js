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
import Sound from 'react-native-sound';
import axiosInstance from '../../config/axiosInstance';
import {styles} from './styles'
import Logo from '../../components/Logo';
import Microphone from '../../icons/microphone_icons.svg';
import StopIcon from '../../icons/stop_icons.svg';
import SpeakerIcon from '../../icons/Speaker_icons.svg';

const audioRecorderPlayer = new AudioRecorderPlayer();

const PreExperienceScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFilePath, setRecordedFilePath] = useState(null);
  const [speechSpeed, setSpeechSpeed] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // “평균 SPM 보기” 토글 상태
  const [showAverageSpm, setShowAverageSpm] = useState(false);

  // (선택) 안드로이드 뒤로가기 버튼 무시
  useEffect(() => {
    const onBackPress = () => true;
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  // 1) 녹음 시작
  const handleRecordStart = async () => {
    try {
      // 기존 결과 초기화
      setFeedback('');
      setSpeechSpeed(null);
      setIsRecording(true);

      // 실제 녹음 시작
      const resultPath = await audioRecorderPlayer.startRecorder();
      setRecordedFilePath(resultPath);
      console.log('사전 체험 녹음 시작:', resultPath);
    } catch (error) {
      console.error('사전 체험 녹음 시작 실패:', error);
      setIsRecording(false);
    }
  };

  // 2) 녹음 정지
  const handleRecordStop = async () => {
    try {
      const resultPath = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      setRecordedFilePath(resultPath);
      console.log('사전 체험 녹음 종료:', resultPath);

      // 서버 업로드 및 분석 요청
      await uploadAndAnalyze(resultPath);
    } catch (error) {
      console.error('사전 체험 녹음 종료 실패:', error);
      setIsRecording(false);
    }
  };

  // 3) 서버 업로드 및 발화속도 분석 요청 (로그인 없이 호출 가능한 엔드포인트 사용)
  const uploadAndAnalyze = async (filePath) => {
    try {
      setIsUploading(true);

      // Android vs iOS 경로 처리
      const uri = Platform.OS === 'android' ? `file://${filePath}` : filePath;
      const mimeType = 'audio/m4a';
      const fileName = 'pre_experience_recording.m4a';

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: mimeType,
        name: fileName,
      });

      const response = await axiosInstance.post(
        '/api/speed/analyze-audio/', // 로그인 필요 없는 경로로 변경
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('사전 체험 서버 응답:', response.data);

      // response.data에 spm, feedback, speed_category 등이 있다고 가정
      setSpeechSpeed(response.data.spm);
      setFeedback(
        response.data.feedback || `발화 속도 등급 ${response.data.speed_category}`
      );
    } catch (error) {
      console.error('사전 체험 서버 업로드/분석 실패:', error);
      // 추가적인 Alert이나 안내 없이 콘솔만 출력
    } finally {
      setIsUploading(false);
    }
  };

  // 4) 녹음 파일 재생
  const handlePlayPress = () => {
    if (!recordedFilePath) return;

    // Android에서는 file://을 제거해야 Sound가 재생 가능
    const path =
      Platform.OS === 'android'
        ? recordedFilePath.replace('file://', '')
        : recordedFilePath;

    console.log('재생할 경로:', path);

    const sound = new Sound(path, '', (error) => {
      if (error) {
        console.error('사전 체험 재생 초기화 실패:', error);
        return;
      }
      sound.play((success) => {
        if (success) {
          console.log('사전 체험 재생 완료');
        } else {
          console.log('사전 체험 재생 중 오류');
        }
        sound.release();
      });
    });
  };

  // 5) 체험 종료
  const handleEndExperience = () => {
    navigation.goBack();
  };

  // 6) 평균 SPM 보기 토글
  const toggleAverageSpm = () => {
    setShowAverageSpm(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <Logo />

      {/* 가로(2열) 버튼 레이아웃 */}
      <View style={styles.buttonRow}>
        {/* 왼쪽: 녹음 시작·정지 버튼 */}
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.buttonWrapper, styles.leftButton]}
            onPress={handleRecordStart}
          >
            <Microphone width={70} height={70} />
            <Text style={styles.buttonText}>
              {isUploading ? '분석 중...' : '녹음 시작'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.buttonWrapper, styles.leftButton]}
            onPress={handleRecordStop}
          >
            <StopIcon width={70} height={70} />
            <Text style={styles.buttonText}>녹음 정지</Text>
          </TouchableOpacity>
        )}

        {/* 오른쪽: 재생 버튼 (녹음 종료 후에만 표시) */}
        {recordedFilePath && !isRecording && (
          <TouchableOpacity
            style={[styles.buttonWrapper, styles.rightButton]}
            onPress={handlePlayPress}
          >
            <SpeakerIcon width={70} height={70} />
            <Text style={styles.buttonText}>재생</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 발화 속도 & 피드백 표시 영역 */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedLabel}>현재 나의 발화속도는?</Text>
        <View style={styles.speedBox}>
          {speechSpeed !== null ? (
            <Text style={styles.speedText}>{`${speechSpeed} SPM`}</Text>
          ) : (
            <Text style={styles.speedPlaceholder}>-</Text>
          )}
        </View>
      </View>

      {feedback !== '' && (
        <Text style={styles.feedbackText}>{feedback}</Text>
      )}

      {/* 평균 SPM 보기 아이콘 */}
      <TouchableOpacity
        style={styles.infoIconWrapper}
        onPress={toggleAverageSpm}
      >
        <Text style={styles.infoIconText}>ℹ️</Text>
      </TouchableOpacity>

      {showAverageSpm && (
        <View style={styles.avgSpmBox}>
          <Text style={styles.avgSpmText}>5~12세 평균 SPM: 111 ~ 160</Text>
          <Text style={styles.avgSPMText}>13~19세 평균 SPM: 141 ~ 250</Text>
          <Text style={styles.avgSPMText}>20세 이상 평균 SPM: 181 ~ 280</Text>
        </View>
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

