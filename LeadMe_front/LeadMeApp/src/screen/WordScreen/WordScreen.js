import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; //React Native CLI 프로젝트
import styles from './styles';
import { COLORS } from '../../styles/colors';
import Logo from '../../components/Logo';

const WordScreen = ({ navigation }) => {
  // 예시 데이터
  const [wordData, setWordData] = useState({
    word: '돼지',
    image: require('../../icons/pig.png'), // 예시 이미지
    isFavorite: false,
  });

  const handleToggleFavorite = () => {
    setWordData(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
  };

  const handlePractice = () => {
    alert('문장 연습 시작!');
  };

  const handlePrev = () => {
    alert('이전 단어는 없습니다.');
  };

  const handleNext = () => {
    alert('다음 단어는 없습니다.');
  };

  const isFirst = true;
  const isLast = true;

  return (
    <View style={styles.container}>
      <Logo/>

      {/* 이미지 */}
      <Image source={wordData.image} style={styles.image} />

      {/* 단어 + 즐겨찾기 */}
      <View style={styles.wordContainer}>
        <Text style={styles.wordText}>{wordData.word}</Text>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <FontAwesome
            name={wordData.isFavorite ? "star" : "star-o"}
            size={30}
            color={wordData.isFavorite ? "gold" : COLORS.textGray}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      </View>

      {/* 문장 연습 버튼 */}
      <TouchableOpacity style={styles.practiceButton} onPress={handlePractice}>
        <Text style={styles.practiceButtonText}>문장 연습</Text>
      </TouchableOpacity>

      {/* 하단 네비게이션 버튼들 */}
      <View style={styles.navContainer}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.navButtonText}>홈</Text>
        </TouchableOpacity>

        {isFirst && (
          <TouchableOpacity style={styles.beforeButton} onPress={handlePrev}>
            <Text style={styles.navButtonText}>이전 단어</Text>
          </TouchableOpacity>
        )}

        {isLast && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>다음 단어</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default WordScreen;
