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