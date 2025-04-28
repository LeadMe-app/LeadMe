import React from 'react';
import { View, Text, TouchableOpacity, } from 'react-native';
import BackButton from '../../components/BackButton';
import {styles} from './styles';
import Logo from '../../components/Logo';

const SelectSpeechTypeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Logo />

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#FFD8A9' }]}
        onPress={() => navigation.navigate('FreeSpeechScreen')}
      >
        <Text style={styles.optionTitle}>직접 발화</Text>
        <Text style={styles.optionSubtitle}>자유롭게 말합니다</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#A9D6FD' }]}
        onPress={() => navigation.navigate('SentenceSpeech')}
      >
        <Text style={styles.optionTitle}>문장 발화</Text>
        <Text style={styles.optionSubtitle}>제공된 문장을 따라 읽습니다</Text>
      </TouchableOpacity>


      <BackButton />
    </View>
  );
};

export default SelectSpeechTypeScreen;
