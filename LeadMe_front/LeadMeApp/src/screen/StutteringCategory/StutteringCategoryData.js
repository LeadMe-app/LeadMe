import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import BackButton from '../../components/BackButton';
import {styles} from './styles';
import Logo from '../../components/Logo';

const SelectWordModeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      < Logo />

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