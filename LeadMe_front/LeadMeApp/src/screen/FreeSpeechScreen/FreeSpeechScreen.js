import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import BackButton from '../../components/BackButton';
import Logo from '../../components/Logo';
import { styles } from './styles';   // 요렇게 불러옴

const FreeSpeechScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleRecordPress = () => {
    setIsRecording(true);

    // 임시로 결과 세팅 (실제는 백엔드 연산 후 값 받아야 함)
    setTimeout(() => {
      setSpeechSpeed('150 spm');
      setFeedback('조금만 천천히 말해볼까요?');
    }, 2000);
  };

  const handleStopPress = () => {
    console.log('녹음 중지');
  };

  const handlePlayPress = () => {
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
