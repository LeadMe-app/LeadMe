import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Logo from '../../components/Logo';
import { useFavorites } from '../FavoriteWordsScreen/FavoriteWordsScreen';

const WordDetailScreen = ({ route, navigation }) => {
  const { word, wordId, imageUrl } = route.params;
  const { favorites, toggleFavorite } = useFavorites();

  const isFavorite = favorites.some((f) => f.word_id === wordId);

  return (
    <View style={styles.container}>
      <Logo />

      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />

      <View style={styles.wordRow}>
        <Text style={styles.wordText}>{word}</Text>
        <TouchableOpacity onPress={() => toggleFavorite(wordId)}>
          <Text style={styles.star}>{isFavorite ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.practiceButton}>
        <Text style={styles.practiceText}>문장 연습</Text>
      </TouchableOpacity>

      <View style={styles.navRow}>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: '#2ecc71' }]}>
          <Text style={styles.navText}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: '#34495e' }]}>
          <Text style={styles.navText}>이전 단어</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: '#e74c3c' }]}>
          <Text style={styles.navText}>다음 단어</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WordDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E1',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 220,
    height: 220,
    marginVertical: 20,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  wordText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 10,
  },
  star: {
    fontSize: 28,
  },
  practiceButton: {
    backgroundColor: '#A9D6FD',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 40,
  },
  practiceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    gap: 16,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  navText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
