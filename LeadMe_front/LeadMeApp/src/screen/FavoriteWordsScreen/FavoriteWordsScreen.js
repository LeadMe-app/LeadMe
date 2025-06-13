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
  const [initialized, setInitialized] = useState(false); // Provider 로직 로그인 이후 제한 위해 수정

  const fetchFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('userId');

      const res = await axiosInstance.get('/api/words/favorites/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: userId },
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
    const checkLoginAndFetch = async () => {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('userId');
      if(token&&userId){
        await fetchFavorites();
        setInitialized(true);
      }
    };
    checkLoginAndFetch();
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

  const handleDeleteFavorite = async (favoriteId, wordId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('userId');

      const response = await axiosInstance.delete(`/api/words/favorites/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: userId, word_id: wordId },
      });

      if (response.status === 204) {
        setFavorite(favorites.filter(fav => fav.favorite_id !== favoriteId));
        await refreshFavorites();
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

export const FavoriteWordsScreen = ({ navigation }) => {
  const { favorites, words, loading, handleDeleteFavorite } = useFavorites();

  const handleGoToWord = ({ word_id, index }) => {
    navigation.navigate('WordScreen', {
      wordId: word_id,
      favorites: favorites,
      currentIndex: index,
    });
  };

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <Logo />
        <Text style={styles.empty}>즐겨찾기된 단어가 없습니다.</Text>
        <BackButton style={{ position: 'absolute', bottom: 20, alignSelf: 'center' }} />
      </View>
    );
  }

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
        keyExtractor={(item) => item.favorite_id.toString()}
        renderItem={({ item, index }) => {
          const word = words[index];

          return (
            <View style={styles.wordItemContainer}>
              <TouchableOpacity
                style={styles.wordButton}
                onPress={() => handleGoToWord({ word_id: item.word_id, index })}
              >
                <Text style={styles.wordText}>{word || '단어 로딩 중...'}</Text>
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
      <View style={{alignItems: 'center'}}>
        <BackButton style={{ position: 'absolute', bottom: 20, alignItems: 'center'}} />
      </View>
    </View>
  );
};
