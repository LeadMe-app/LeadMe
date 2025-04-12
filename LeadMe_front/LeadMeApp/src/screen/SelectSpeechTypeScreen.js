import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BackButton from '../components/BackButton'; 

const SelectSpeechTypeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEAD ME</Text>

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#FFD8A9' }]}
        onPress={() => navigation.navigate('FreeSpeech')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6EB',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    color: '#A259FF',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  optionBox: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    elevation: 4,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#333',
  },
});
