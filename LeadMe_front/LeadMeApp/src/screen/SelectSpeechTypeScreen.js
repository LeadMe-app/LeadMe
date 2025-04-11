import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SelectSpeechTypeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEAD ME</Text>

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#FFD8A9' }]}
        onPress={() => navigation.navigate('FreeSpeech')} // 추후 직접 발화 실제 페이지로 연결
      >
        <Text style={styles.optionTitle}>직접 발화</Text>
        <Text style={styles.optionSubtitle}>자유롭게 말합니다</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#A9D6FD' }]}
        onPress={() => navigation.navigate('SentenceSpeech')} // 추후 문장 발화 실제 페이지로 연결
      >
        <Text style={styles.optionTitle}>문장 발화</Text>
        <Text style={styles.optionSubtitle}>제공된 문장을 따라 읽습니다</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>뒤로 가기</Text>
      </TouchableOpacity>
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
  },
  title: {
    fontSize: 20,
    color: '#A259FF',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  optionBox: {
    width: '90%',
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
  backButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    paddingHorizontal: 100,
    borderRadius: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
