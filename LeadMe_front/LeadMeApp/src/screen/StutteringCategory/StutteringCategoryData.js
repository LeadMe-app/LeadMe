import React, { useState } from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import {styles} from './styles';
import Logo from '../../components/Logo';
import WordInfoModal from '../../components/WordInfoModal';

const SelectWordModeScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <View style={styles.container}>
      < Logo />

      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.optionBox, { backgroundColor: '#FFD8A9' }]}
          onPress={() => navigation.navigate('RandomWordScreen')}
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
        onPress={() => navigation.navigate('FavoriteWordsScreen')}
      >
        <Text style={styles.fullWidthText}>즐겨찾기 단어</Text>
      </TouchableOpacity>

    <View style={{ marginTop : '60' }}>
      <TouchableOpacity
            style={{
            backgroundColor: '#F8D7A9',
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 6,
          }}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ fontWeight: '500' }}>말더듬증 학습 방법</Text>
          </TouchableOpacity>
    </View>
      
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('HomeScreen')}>
          <Text style={styles.navButtonText}>뒤로 가기</Text>
      </TouchableOpacity>
      <WordInfoModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
    
  );
};

export default SelectWordModeScreen;