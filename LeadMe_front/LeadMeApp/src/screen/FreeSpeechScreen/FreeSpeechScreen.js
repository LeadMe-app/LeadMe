import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import BackButton from '../../components/BackButton';
import Logo from '../../components/Logo';

const FreeSpeechScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false); // 녹음 중 상태
  const [speechSpeed, setSpeechSpeed] = useState(null); // 발화 속도 결과
  const [feedback, setFeedback] = useState(''); // 추가 피드백 문구

  const handleRecordPress = () => {
    setIsRecording(true);

    // 임시로 녹음 후 결과 세팅 (실제는 백엔드 연산 후 값 받아야 함)
    setTimeout(() => {
      setSpeechSpeed('150 spm');
      setFeedback('조금만 천천히 말해볼까요?');
    }, 2000); 
  };

  const handleStopPress = () => {
    // 녹음 정지 처리 (여기에 백엔드 호출 코드 연동 예정)
    console.log('녹음 중지');
  };

  const handlePlayPress = () => {
    // 녹음 파일 재생 기능 (추후 추가)
    console.log('녹음 재생');
  };

  return (
    <View style={styles.container}>
      <Logo />

      <View style={styles.iconRow}>
        {!isRecording ? (
          <TouchableOpacity onPress={handleRecordPress}>
            <Image source={require('../../icons/mike_icon.png')} style={styles.icon} />
            <Text style={styles.iconText}>녹음</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={handleStopPress}>
              <Image source={require('../../icons/stop_icon.png')} style={styles.icon} />
              <Text style={styles.iconText}>녹음</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPress}>
              <Image source={require('../../icons/play_icon.png')} style={styles.icon} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6EB',
    alignItems: 'center',
    paddingTop: 60,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 50,
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  iconText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#FFD8A9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContent: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  feedbackText: {
    color: '#E74C3C',
    fontSize: 16,
    marginTop: 8,
    fontWeight: 'bold',
  },
});
