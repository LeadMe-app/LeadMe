import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../config/axiosInstance';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; //React Native CLI 프로젝트
import styles from './styles';
import { COLORS } from '../../styles/colors';
import Logo from '../../components/Logo';

const WordScreen = ({ navigation, route }) => {
  const {wordId} = route.params;

  const [wordData, setWordData] = useState({
    word: '',
    image: null,
    isFavorite: false,
    favoriteId: null, 
  });

  useEffect(() => {
    const fetchWord = async () => {
      try {
        const response = await axiosInstance.get(`/api/words/${wordId}`);
        const data = response.data;

        setWordData({
          word: data.word,
          image: { uri: data.image_url }, 
          isFavorite: data.is_favorite || false, 
          favoriteId: data.favorite_id || null,
        });
      } catch (error) {
        console.error('단어를 불러오는 데 실패했습니다:', error);
        Alert.alert('오류', '단어 정보를 불러오지 못했습니다.');
      }
    };

    fetchWord();
  }, [wordId]);
  
  const handleToggleFavorite = async () => {
    const newFavorite = !wordData.isFavorite;
    setWordData(prev => ({ ...prev, isFavorite: newFavorite }));

    try {
      const userId = await AsyncStorage.getItem('userId');  // AsyncStorage에서 userId 가져오기
      const wordId = route.params.wordId;
      
      if (!userId) {
        Alert.alert('오류', '사용자 정보가 없습니다.');
        return;
      }

      if (newFavorite) {
        // 즐겨찾기 추가 요청
        const response = await axiosInstance.post(`/api/words/favorites/`, {
          user_id:userId,
          word_id:wordId,
        });
        if (response.status === 201) {
          setWordData(prev => ({
            ...prev,
            favoriteId: response.data.favorite_id,
          }));
          Alert.alert('즐겨찾기 추가', '단어가 즐겨찾기에 추가되었습니다.');
        }else {
          throw new Error('즐겨찾기 추가 실패');
        }
      }  else {
        // 즐겨찾기 삭제 요청
        const response = await axiosInstance.delete(`/api/words/favorites/${wordData.favoriteId}`);

        if (response.status === 204) {
          // 즐겨찾기 삭제 후 favoriteId 초기화
          setWordData(prev => ({
            ...prev,
            favoriteId: null, // 즐겨찾기 삭제 후 favoriteId 초기화
          }));
          Alert.alert('즐겨찾기 삭제', '단어가 즐겨찾기에서 삭제되었습니다.');
        }
      }
    } catch (error) {
      console.error('즐겨찾기 처리 실패:', error);
      Alert.alert('오류', '즐겨찾기 설정에 실패했습니다.');
    }
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

  const handleGoBack = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const res = await axiosInstance.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const username = res.data.username;
        navigation.navigate('HomeScreen', { username });
      } else {
        console.warn('토큰이 없습니다.');
      }
    } catch (error) {
      console.error('사용자 정보를 불러오지 못했습니다:', error);
    }
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
          onPress={handleGoBack}
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
