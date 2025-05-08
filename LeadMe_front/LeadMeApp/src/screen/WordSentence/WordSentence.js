import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './styles';
import Logo from '../../components/Logo';
import Sound from '../../icons/sound_icons.svg';
import Micro from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import Play from '../../icons/play_icons.svg';

const WordSentence = ({navigation}) => {
  const [isRecording, setIsRecording] = useState(false);

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
      <Text style={[styles.sentence]}>
        나는 <Text style={styles.boldText}>천천히 또박또박</Text> 말하는 연습을 하고 있어요.
      </Text> 

      <View style={styles.underline} />

      <TouchableOpacity>
        <Sound width={40} height={40} marginTop={30}/>
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
          <Text style={styles.bottomButtonText}>문장연습 종료</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.otherButton}>
          <Text style={styles.bottomButtonText}>다른 문장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WordSentence;
