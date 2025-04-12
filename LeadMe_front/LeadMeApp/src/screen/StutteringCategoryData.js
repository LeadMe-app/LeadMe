import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BackButton from '../components/BackButton';

const SelectWordModeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEAD ME</Text>

      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.optionBox, { backgroundColor: '#FFD8A9' }]}
          onPress={() => navigation.navigate('RandomWord')}
        >
          <Text style={styles.optionTitle}>랜덤</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionBox, { backgroundColor: '#A9D6FD' }]}
          onPress={() => navigation.navigate('WordList')}
        >
          <Text style={styles.optionTitle}>단어 리스트</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.fullWidthBox}
        onPress={() => navigation.navigate('FavoriteWords')}
      >
        <Text style={styles.fullWidthText}>즐겨찾기 단어</Text>
      </TouchableOpacity>

      <BackButton />
    </View>
  );
};

export default SelectWordModeScreen;

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
    color: '#8E44AD',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  optionBox: {
    width: '48%',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    shadowColor: '#000',
    elevation: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  fullWidthBox: {
    width: '100%',
    backgroundColor: '#C1E1C1',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    elevation: 2,
  },
  fullWidthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
