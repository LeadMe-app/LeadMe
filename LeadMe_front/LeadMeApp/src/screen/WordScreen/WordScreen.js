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
  const { wordId, favorites: passedFavorites, currentIndex: passedIndex } = route.params || {};
  const { refreshFavorites } = useFavorites();

  const [favorites, setFavorites] = useState(passedFavorites || []);
  const [currentIndex, setCurrentIndex] = useState(passedIndex ?? null);
  const [allWords, setAllWords] = useState([]);
  const [wordData, setWordData] = useState({
    word: '',
    image: null,
    isFavorite: false,
    favoriteId: null,
  });

  // 전체 단어 목록을 불러옴 (즐겨찾기에서 진입하지 않은 경우에만)
  const fetchAllWords = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axiosInstance.get('/api/words/', {
        params: { user_id: userId },
      });
      setAllWords(response.data);
    } catch (error) {
      console.error('전체 단어 목록 불러오기 실패:', error);
    }
  };

  // 현재 단어 정보 불러오기
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
        favoriteId: data.favorite_id || null,
      });
    } catch (error) {
      console.error('단어 정보 불러오기 실패:', error);
      Alert.alert('오류', '단어 정보를 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    fetchWord(wordId);
  }, [wordId]);

  useEffect(() => {
    if (!passedFavorites) {
      fetchAllWords();
    }
  }, []);

  // ✅ 즐겨찾기에서 진입한 경우 currentIndex 유지하도록 분기 추가
  useEffect(() => {
    if (!passedFavorites && allWords.length > 0 && currentIndex === null) {
      const index = allWords.findIndex(word => word.word_id === wordId);
      setCurrentIndex(index);
    }
  }, [allWords, wordId]);

  const handleToggleFavorite = async () => {
    const newFavorite = !wordData.isFavorite;
    setWordData(prev => ({ ...prev, isFavorite: newFavorite }));

    try {
      const userId = await AsyncStorage.getItem('userId');

      if (newFavorite) {
        const response = await axiosInstance.post(`/api/words/favorites/`, {
          user_id: userId,
          word_id: wordId,
        });
        if (response.status === 201) {
          setWordData(prev => ({ ...prev, favoriteId: response.data.favorite_id }));
          await refreshFavorites();
          Alert.alert('즐겨찾기 추가', '단어가 즐겨찾기에 추가되었습니다.');
        }
      } else {
        const response = await axiosInstance.delete(`/api/words/favorites/`, {
          params: { user_id: userId, word_id: wordId },
        });

        if (response.status === 204) {
          setWordData(prev => ({ ...prev, isFavorite: false, favoriteId: null }));
          await refreshFavorites();
          Alert.alert('즐겨찾기 삭제', '단어가 즐겨찾기에서 삭제되었습니다.');
        }
      }
    } catch (error) {
      console.error('즐겨찾기 처리 실패:', error);
      Alert.alert('오류', '즐겨찾기 설정에 실패했습니다.');
    }
  };

  const handlePrev = () => {
    const list = favorites?.length ? favorites : allWords;
    if (currentIndex > 0) {
      const prevWord = list[currentIndex - 1];
      navigation.replace('WordScreen', {
        wordId: prevWord.word_id,
        favorites: favorites?.length ? favorites : null,
        currentIndex: currentIndex - 1,
      });
    } else {
      Alert.alert('알림', '이전 단어가 없습니다.');
    }
  };

  const handleNext = () => {
    const list = favorites?.length ? favorites : allWords;
    if (currentIndex < list.length - 1) {
      const nextWord = list[currentIndex + 1];
      navigation.replace('WordScreen', {
        wordId: nextWord.word_id,
        favorites: favorites?.length ? favorites : null,
        currentIndex: currentIndex + 1,
      });
    } else {
      Alert.alert('알림', '다음 단어가 없습니다.');
    }
  };

  const handlePractice = () => {
    navigation.navigate('WordSentence', {
      word: wordData.word,
      wordId: wordId,
      favorites: favorites?.length ? favorites : null,
      currentIndex: currentIndex,
    });
  };

  if (!wordData.word) {
    return <Text>로딩 중...</Text>;
  }

  return (
    <View style={styles.container}>
      <Logo />
      <Image source={wordData.image} style={styles.image} />
      <View style={styles.wordContainer}>
        <Text style={styles.wordText}>{wordData.word}</Text>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <FontAwesome
            name={wordData.isFavorite ? 'star' : 'star-o'}
            size={30}
            color={wordData.isFavorite ? 'gold' : COLORS.textGray}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.practiceButton} onPress={handlePractice}>
        <Text style={styles.practiceButtonText}>문장 연습</Text>
      </TouchableOpacity>

      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('HomeScreen')}>
          <Text style={styles.navButtonText}>홈</Text>
        </TouchableOpacity>

        {currentIndex > 0 && (
          <TouchableOpacity style={styles.beforeButton} onPress={handlePrev}>
            <Text style={styles.navButtonText}>이전 단어</Text>
          </TouchableOpacity>
        )}

        {currentIndex !== null &&
          ((favorites?.length && currentIndex < favorites.length - 1) ||
            (!favorites?.length && currentIndex < allWords.length - 1)) && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>다음 단어</Text>
            </TouchableOpacity>
          )}
      </View>
    </View>
  );
};

export default WordScreen;
