import React, { useState, useEffect, useContext, createContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import Logo from '../../components/Logo';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';

const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
  const [favorites, setFavorite] = useState([]);
  const [words, setWords] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const res = await axiosInstance.get('/api/words/favorites/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFavorite(res.data); // 서버에서 받을 즐겨찾기 리스트.
      } catch (error) {
        console.error('즐겨찾기 불러오기 실패:', error);
        Alert.alert('오류', '즐겨찾기를 불러오지 못했습니다.');
      }
    };
    fetchFavorites();
  }, []);

  useEffect(() => {
    // 즐겨찾기 리스트에서 word_id에 해당하는 단어들을 한 번에 요청
    const fetchWords = async () => {
      try {
        const wordIds = favorites.map((fav) => fav.word_id); // favorites에서 word_id만 뽑기
        const promises = wordIds.map((wordId) => fetchWord(wordId)); // 각각의 단어를 받아오기
        const wordList = await Promise.all(promises);
        setWords(wordList); // 받아온 단어 리스트
      } catch (error) {
        console.error('단어 불러오기 실패:', error);
      }
    };
    if (favorites.length > 0) {
      fetchWords();
    }
  }, [favorites]);

  const fetchWord = async (wordId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axiosInstance.get(`/api/words/${wordId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.word; // 받아온 단어
    } catch (error) {
      console.error('단어 불러오기 실패:', error);
      Alert.alert('오류', '단어를 불러오지 못했습니다.');
    }
  };

  const toggleFavorite = async (wordId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const existing = favorites.find((f) => f.word_id === wordId);

      if (existing) {
        // 즐겨찾기 삭제
        await axiosInstance.delete(`/api/words/favorites/${existing.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFavorite((prev) => prev.filter((f) => f.id !== existing.id));
      } else {
        // 즐겨찾기 추가
        const res = await axiosInstance.post(
          '/api/words/favorites/',
          { word_id: wordId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFavorite((prev) => [...prev, res.data]);
      }
    } catch (error) {
      console.error('즐겨찾기 추가/삭제 실패:', error);
      Alert.alert('오류', '즐겨찾기 처리에 실패했습니다.');
    }
  };

  return (
    <FavoriteContext.Provider value={{ favorites, words }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoriteContext);

// 즐겨찾기 화면
export const FavoriteWordsScreen = ({ navigation }) => {
  const { favorites, words } = useFavorites();

  const handleGoToWord = (item) => {
    navigation.navigate('WordDetailScreen', {
      word: item.word,
      wordId: item.word_id,
      imageUrl: item.image_url,
    });
  };

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={styles.title}>⭐ 즐겨찾기 단어</Text>

      {favorites.length === 0 ? (
        <Text style={styles.empty}>즐겨찾기된 단어가 없습니다.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.favorite_id.toString()} // favorite_id를 키로 사용
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.wordButton}
              onPress={() => handleGoToWord(item)}>
              <Text style={styles.wordText}>
                {words[index] ? words[index] : "단어 로딩 중..."}
              </Text> 
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};
