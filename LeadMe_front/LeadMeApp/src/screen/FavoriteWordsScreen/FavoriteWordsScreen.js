import React, {useState, useContext, createContext} from 'react';
import {View, Text, TouchableOpacity, FlatList, styleSheet} from 'react-native';
import Logo from '../../components/Logo';

const FavoriteContext = createContext();

export const FavoriteProvider = ({children}) => {
    const [favorites, setFavorite] = useState([]);

    const toggleFavorite = (word) => {
        setFavorite((prev) =>
            prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
        );
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

    const handleGoToWord = (screenName) => {
        navigation.navigate(screenName);
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
                    keyExtractor = {(item) => item}
                    renderItem = {({item}) => (
                        <TouchableOpacity
                            style={styles.wordButton}
                            onPress = {() => handleGoToWord(item)}>
                            <Text style={styles.wordText}>{item}</Text>    
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

// 3. 스타일 정의

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