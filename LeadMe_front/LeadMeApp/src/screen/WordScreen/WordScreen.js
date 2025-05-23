import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../config/axiosInstance';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; 
import { useFavorites } from '../FavoriteWordsScreen/FavoriteWordsScreen';
import styles from './styles';
import { COLORS } from '../../styles/colors';
import Logo from '../../components/Logo';

const WordScreen = ({ navigation, route }) => {
  const { wordId } = route.params;
  const { refreshFavorites } = useFavorites();

  const [wordData, setWordData] = useState({
    word: '',
    image: null,
    isFavorite: false,
    favoriteId: null,
  });
  const [allWords, setAllWords] = useState([]); // 단어 목록 상태 추가
  const [currentIndex, setCurrentIndex] = useState(null); // 현재 단어의 인덱스를 추적

  // 단어 목록을 가져오는 함수
  const fetchAllWords = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axiosInstance.get('/api/words/', {
        params: { user_id: userId },
      });
      setAllWords(response.data); // 단어 목록 저장
    } catch (error) {
      console.error('단어 목록을 불러오는 데 실패했습니다:', error);
      Alert.alert('오류', '단어 목록을 불러오지 못했습니다.');
    }
  };

  // 현재 단어 정보 가져오기
  const fetchWord = async (wordId) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axiosInstance.get(`/api/words/${wordId}`, {
        params: { user_id: userId },
      });
      const data = response.data;
      setWordData({
        word: data.word,
        image: { uri: data.image_url },
        isFavorite: data.is_favorite || false,
      });
    } catch (error) {
      console.error('단어를 불러오는 데 실패했습니다:', error);
      Alert.alert('오류', '단어 정보를 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    fetchAllWords();
  }, []);

  useEffect(() => {
    if (allWords.length > 0) {
      const index = allWords.findIndex(word => word.word_id === wordId);
      setCurrentIndex(index);
      fetchWord(wordId); // 현재 단어의 정보를 불러옵니다.
    }
  }, [allWords, wordId]);

  const handleToggleFavorite = async () => {
    const newFavorite = !wordData.isFavorite;
    setWordData(prev => ({ ...prev, isFavorite: newFavorite }));

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('오류', '사용자 정보가 없습니다.');
        return;
      }

      if (newFavorite) {
        const response = await axiosInstance.post(`/api/words/favorites/`, {
          user_id: userId,
          word_id: wordId,
        });
        if (response.status === 201) {
          setWordData(prev => ({
            ...prev,
            favoriteId: response.data.favorite_id,
          }));
          await refreshFavorites();
          Alert.alert('즐겨찾기 추가', '단어가 즐겨찾기에 추가되었습니다.');
        }
      } else {
        const response = await axiosInstance.delete(`/api/words/favorites/`, {
          params: { user_id: userId, word_id: wordId },
        });

        if (response.status === 204) {
          setWordData(prev => ({
            ...prev,
            isFavorite: false,
            favoriteId: null,
          }));
          await refreshFavorites();
          Alert.alert('즐겨찾기 삭제', '단어가 즐겨찾기에서 삭제되었습니다.');
        }
      }
    } catch (error) {
      console.error('즐겨찾기 처리 실패:', error);
      Alert.alert('오류', '즐겨찾기 설정에 실패했습니다.');
    }
  };

  // 이전 단어로 이동
  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevWord = allWords[currentIndex - 1];
      navigation.replace('WordScreen', { wordId: prevWord.word_id });
    } else {
      Alert.alert('알림', '이전 단어가 없습니다.');
    }
  };

  // 다음 단어로 이동
  const handleNext = () => {
    if (currentIndex < allWords.length - 1) {
      const nextWord = allWords[currentIndex + 1];
      navigation.replace('WordScreen', { wordId: nextWord.word_id });
    } else {
      Alert.alert('알림', '다음 단어가 없습니다.');
    }
  };

  const handlePractice = () => {
    navigation.navigate('WordSentence', { word : wordData.word, wordId:wordId,});
  };

  const handleGoBack = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const res = await axiosInstance.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const username = res.data.username;
        navigation.navigate('HomeScreen');
      } else {
        console.warn('토큰이 없습니다.');
      }
    } catch (error) {
      console.error('사용자 정보를 불러오지 못했습니다:', error);
    }
  };

  if (!wordData.word) {
    return <Text>로딩 중...</Text>;
  }

  return (
    <View style={styles.container}>
      <Logo />

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
        <TouchableOpacity style={styles.navButton} onPress={handleGoBack}>
          <Text style={styles.navButtonText}>홈</Text>
        </TouchableOpacity>

        {currentIndex > 0 && (
          <TouchableOpacity style={styles.beforeButton} onPress={handlePrev}>
            <Text style={styles.navButtonText}>이전 단어</Text>
          </TouchableOpacity>
        )}

        {currentIndex < allWords.length - 1 && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>다음 단어</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default WordScreen;