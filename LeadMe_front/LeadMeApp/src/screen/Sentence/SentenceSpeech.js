import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './styles';
import Logo from '../../components/Logo';
import Sound from '../../icons/sound_icons.svg';

const SentenceSpeech = () => {
  const [isPracticing, setIsPracticing] = useState(false);

  const handlePracticeToggle = () => {
    setIsPracticing(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={[styles.sentence, isPracticing && styles.sentenceActive]}>
        나는 <Text style={styles.boldText}>천천히 또박또박</Text> 말하는 연습을 하고 있어요.
      </Text> 

      <Sound width={80} height={80} marginRight={15}/>
      <TouchableOpacity style={styles.dropdown}>
        <Text style={styles.dropdownText}>원하는 속도를 선택하세요</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={isPracticing ? styles.stopButton : styles.startButton}
        onPress={handlePracticeToggle}
      >
        <Text style={styles.practiceButtonText}>
          {isPracticing ? '연습 종료' : '연습 시작'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.endButton}>
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
