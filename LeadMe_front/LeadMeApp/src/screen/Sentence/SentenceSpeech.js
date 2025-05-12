import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './styles';
import Logo from '../../components/Logo';
import Sound from '../../icons/sound_icons.svg';
import Micro from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import Play from '../../icons/play_icons.svg';

const SentenceSpeech = ({navigation}) => {
  const [isPracticing, setIsPracticing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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


  return (
    <View style={styles.container}>
      <Logo />
      <Text style={[styles.sentence, isPracticing && styles.sentenceActive]}>
        나는 <Text style={styles.boldText}>천천히 또박또박</Text> 말하는 연습을 하고 있어요.
      </Text> 

      <View style={styles.underline} />

      <View style={styles.topRow}>
        <TouchableOpacity>
          <Sound width={40} height={40} />
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
        <TouchableOpacity style={styles.otherButton}>
          <Text style={styles.bottomButtonText}>다른 문장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SentenceSpeech;
