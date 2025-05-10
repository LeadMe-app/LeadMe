import React, {useState, useEffect, useContext, createContext} from 'react';
import {View, Text, TouchableOpacity, FlatList, styleSheet} from 'react-native';
import Logo from '../../components/Logo';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavoriteContext = createContext();

export const FavoriteProvider = ({children}) => {
    const [favorites, setFavorite] = useState([]);

    useEffect(() => {
        const fetchFavorites = async() => {
            try {
                const token = await AsyncStorage.getItem('access_token');
                const res = await axiosInstance.get('api/words/favorites/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setFavorite(res.data); // 서버에서 받을 즐겨찾기 리스트.
            } catch (error){
                console.error('즐겨찾기 불러오기 실패:', error);
            }
        };
        fetchFavorites();
    }, []);
    const toggleFavorite = async (wordId) => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            const existing = favorites.find((f) => f.word_id === wordId);

            if (existing) {
                // 삭제
                await axiosInstance.delete(`api/words/favorites/${existing.id}`, {
                    headers:{
                        Authorization: `Bearer ${token}`,
                    },
                });
                setFavorite((prev) => prev.filter((f) => f.id !== existing.id));
            } else {
                // 추가
                const res = await axiosInstance.post(
                    '/api/words/favorites/',
                    {word_id: wordId},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setFavorite((prev) => [...prev, res.data]);
            }
        } catch (error){
            console.error('즐겨찾기 추가/삭제 실패:', error);
        }
        
    };
    return (
        <FavoriteContext.Provider value = {{favorites, toggleFavorite}}>
            {children}
        </FavoriteContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoriteContext);

// 2. 즐겨찾기 화면

export const FavoriteWordsScreen = ({navigation}) => {
    const {favorites} = useFavorites();

    const handleGoToWord = (item) => {
        navigation.navigate('WordDetailScreen', {
            word: item.word,
            wordId: item.word_id,
            imageUrl: item.image_url,
        });
    };

    return (
        <View style = {styles.container}>
            <Logo />
            <Text style = {styles.title}>⭐ 즐겨찾기 단어</Text>

            {favorites.length === 0 ? (
                <Text style = {styles.empty}>즐겨찾기된 단어가 없습니다.</Text>
            ) : (
                <FlatList
                    data = {favorites}
                    keyExtractor = {(item) => item.id.toString()}
                    renderItem = {({item}) => (
                        <TouchableOpacity
                            style={styles.wordButton}
                            onPress = {() => handleGoToWord(item)}>
                            <Text style={styles.wordText}>{item.word}</Text>    
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

// 스타일
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF4E1',
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    empty: {
      fontSize: 18,
      color: '#888',
    },
    wordButton: {
      backgroundColor: '#FFE5B4',
      padding: 16,
      marginVertical: 8,
      borderRadius: 10,
      width: '100%',
      alignItems: 'center',
    },
    wordText: {
      fontSize: 18,
    },
  });