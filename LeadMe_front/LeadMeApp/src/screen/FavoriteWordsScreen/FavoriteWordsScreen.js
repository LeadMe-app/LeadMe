import React, { useState, useEffect, useContext, createContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import Logo from '../../components/Logo';
import BackButton from '../../components/BackButton';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';

const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
  const [favorites, setFavorite] = useState([]);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('userId');

      const res = await axiosInstance.get('/api/words/favorites/', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          user_id: userId, 
        },
      });
      setFavorite(res.data);
    } catch (error) {
      console.error('즐겨찾기 불러오기 실패:', error);
      Alert.alert('오류', '즐겨찾기를 불러오지 못했습니다.');
    }
  };

  const fetchWords = async () => {
    try {
      const wordIds = favorites.map((fav) => fav.word_id);
      const promises = wordIds.map((wordId) => fetchWord(wordId));
      const wordList = await Promise.all(promises);
      setWords(wordList);
      setLoading(false);
    } catch (error) {
      console.error('단어 불러오기 실패:', error);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (favorites.length > 0) {
      fetchWords();
    }
  }, [favorites]);

  const fetchWord = async (wordId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axiosInstance.get(`/api/words/${wordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.word;
    } catch (error) {
      console.error('단어 불러오기 실패:', error);
      Alert.alert('오류', '단어를 불러오지 못했습니다.');
    }
  };

  const refreshFavorites = async () => {
    await fetchFavorites();
  };

  // 즐겨찾기 삭제 요청
  const handleDeleteFavorite = async (favoriteId, wordId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('userId');

      const response = await axiosInstance.delete(`/api/words/favorites/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          user_id: userId,
          word_id: wordId,
        },
      });

      if (response.status === 204) {
        // 즐겨찾기 삭제 후, 상태 갱신
        setFavorite(favorites.filter(fav => fav.favorite_id !== favoriteId));
        await refreshFavorites(); // 갱신된 즐겨찾기 목록
        Alert.alert('즐겨찾기 삭제', '단어가 즐겨찾기에서 삭제되었습니다.');
      } else {
        Alert.alert('오류', '즐겨찾기 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('즐겨찾기 삭제 실패:', error);
      Alert.alert('오류', '즐겨찾기 삭제에 실패했습니다.');
    }
  };

  return (
    <FavoriteContext.Provider value={{ favorites, words, loading, refreshFavorites, handleDeleteFavorite }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoriteContext);

// 즐겨찾기 화면
export const FavoriteWordsScreen = ({ navigation }) => {
  const { favorites, words, loading, handleDeleteFavorite } = useFavorites();

  const handleGoToWord = ({ word, word_id, image_url }) => {
    navigation.navigate('WordScreen', {
      word,
      wordId: word_id,
      imageUrl: image_url,
    });
  };

  // 즐겨찾기된 단어가 없을 경우 처리
  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <Logo />
        <Text style={styles.empty}>즐겨찾기된 단어가 없습니다.</Text>
        <View>
          <BackButton style={{ position: 'absolute', bottom: 20, alignSelf: 'center' }} />
        </View>
      </View>
    );
  }

  // 단어가 로딩 중일 경우 처리
  if (loading) {
    return (
      <View style={styles.container}>
        <Logo />
        <Text style={styles.empty}>단어를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={styles.title}>⭐ 즐겨찾기 단어</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.favorite_id.toString()} // favorite_id를 키로 사용
        renderItem={({ item, index }) => {
          const word = words[index]; // words 배열에서 단어를 가져옴

          // word가 아직 로딩되지 않았으면 "로딩 중..."을 표시
          if (!word) {
            return (
              <TouchableOpacity style={styles.wordButton}>
                <Text style={styles.wordText}>단어 로딩 중...</Text>
              </TouchableOpacity>
            );
          }

          return (
            <View style={styles.wordItemContainer}>
              <TouchableOpacity
                style={styles.wordButton}
                onPress={() => handleGoToWord({
                  word: word,
                  word_id: item.word_id,
                  image_url: item.image_url,
                })}
              >
                <Text style={styles.wordText}>{word}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteFavorite(item.favorite_id, item.word_id)}
              >
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <View>
        <BackButton style={{ position: 'absolute', bottom: 20, alignSelf: 'center' }} />
      </View>
    </View>
  );
};
