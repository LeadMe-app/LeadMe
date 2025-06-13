import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../config/axiosInstance';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFavorites } from '../FavoriteWordsScreen/FavoriteWordsScreen';
import {styles} from './styles';
import { COLORS } from '../../styles/colors';
import Logo from '../../components/Logo';

const RandomWordScreen = ({ navigation }) => {
  const [wordData, setWordData] = useState(null); // 초기값 null
  const [loading, setLoading] = useState(true);
  const { refreshFavorites } = useFavorites();

  const fetchRandomWord = async () => {
    try {
      setLoading(true);
      console.log('🧪 fetchRandomWord 시작');
      const userId = await AsyncStorage.getItem('userId');
      console.log('👤 userId:', userId);
      if (!userId || userId === 'null') {
        Alert.alert('오류', '로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get('/api/words/random', {
        params: { user_id: userId },
      });
      console.log('✅ response.data:', response.data); 

      const data = response.data;
      console.log('✅ 랜덤 단어 응답:', data);

      if (!data || !data.word || !data.image_url) {
        console.warn('⚠️ 응답 데이터 누락:', data);
        Alert.alert('오류', '단어 정보를 가져오지 못했습니다.');
        return;
      }

      setWordData({
        wordId: data.word_id,
        word: data.word,
        image: { uri: data.image_url },
        isFavorite: data.is_favorite || false,
      });
    } catch (error) {
      console.error('❌ 랜덤 단어 불러오기 실패:', error.response ? error.response.data : error);
      Alert.alert('오류', '랜덤 단어를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!wordData || !wordData.wordId) return;
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
          word_id: wordData.wordId,
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
  const handlePractice = () => {
    navigation.navigate('WordSentence', { word:wordData.word, wordId:wordData.wordId});
  };

  useEffect(() => {
    console.log('🧪 useEffect - fetchRandomWord 실행됨'); // 여기
    fetchRandomWord();
  }, []);

  // ✅ 로딩 or 데이터 없음 → 안전하게 처리
  if (loading || !wordData || !wordData.word) {
    console.log('🔁 로딩 또는 데이터 없음 상태', { loading, wordData });

    return (
      <View style={styles.container}>
        <Logo />
        <ActivityIndicator size="large" color="#8E44AD" />
      </View>
    );
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
            name={wordData.isFavorite ? 'star' : 'star-o'}
            size={30}
            color={wordData.isFavorite ? 'gold' : COLORS.textGray}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      </View>

      {/* 문장 연습 버튼 */}
      <TouchableOpacity style={styles.practiceButton} onPress={handlePractice}>
        <Text style={styles.practiceButtonText}>문장 연습</Text>
      </TouchableOpacity>

      {/* 하단 버튼 */}
      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('StutteringCategoryData')}>
          <Text style={styles.navButtonText}>뒤로 가기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={fetchRandomWord}>
          <Text style={styles.navButtonText}>다른 단어</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RandomWordScreen;
