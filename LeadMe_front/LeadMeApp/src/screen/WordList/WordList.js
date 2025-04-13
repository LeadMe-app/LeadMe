import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import BackButton from '../../components/BackButton';
import { styles } from './styles';
import Logo from '../../components/Logo';

const WordList = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Logo />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.optionBox, { backgroundColor: '#FFD3A5' }]}
          onPress={() => navigation.navigate('Rabbit')}>
          <Text style={styles.optionTitle}>토끼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionBox, { backgroundColor: '#A5D8FF' }]}
          onPress={() => navigation.navigate('Whale')}>
          <Text style={styles.optionTitle}>고래</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.optionBox, { backgroundColor: '#C1E1C1' }]}
          onPress={() => navigation.navigate('Pig')}>
          <Text style={styles.optionTitle}>돼지</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionBox, { backgroundColor: '#FFB6C1' }]}
          onPress={() => navigation.navigate('Monkey')}>
          <Text style={styles.optionTitle}>원숭이</Text>
        </TouchableOpacity>
      </View>

      <BackButton />
    </View>
  );
};

export default WordList;
