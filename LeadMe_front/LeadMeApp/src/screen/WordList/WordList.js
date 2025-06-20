import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { styles } from './styles';
import axiosInstance from '../../config/axiosInstance'; // axios 설정이 들어간 파일
import Logo from '../../components/Logo';
import BackButton from '../../components/BackButton';

const WordList = ({ navigation }) => {
  const [wordList, setWordList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // 에러 상태 추가

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const res = await axiosInstance.get('/api/words/');
        console.log('단어 응답:', res.data);
        setWordList(res.data);
      } catch (error) {
        console.error('단어 목록을 불러오지 못했습니다:', error);
        setError('단어 목록을 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.'); // 에러 메시지 설정
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, []);

  const colors = ['#FFD3A5', '#A5D8FF', '#C1E1C1', '#FFB6C1', '#F8C291'];

  if (loading) {
    return (
      <View style={styles.container}>
        <Logo />
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );  // 로딩 중일 때 로딩 스피너만 보여줌
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Logo />
        <Text style={{ color: 'red' }}>{error}</Text>  {/* 에러 메시지 출력 */}
        <BackButton />
      </View>
    );  // 에러 발생 시 에러 메시지 출력
  }

  if (wordList.length === 0) {
    return (
      <View style={styles.container}>
        <Logo />
        <Text>등록된 단어가 없습니다.</Text>  {/* 단어 목록이 비었을 경우 */}
        <BackButton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Logo />
      <FlatList
        data={wordList}
        keyExtractor={(item) => item.word_id.toString()}
        numColumns={2} // 바둑판: 2열
        contentContainerStyle={{ paddingBottom: 100 }} // 버튼 영역 피하기
        columnWrapperStyle={{ justifyContent: 'space-around' }} // 좌우 정렬
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.optionBox,
              {
                backgroundColor: colors[index % colors.length],
                width: '45%',
                marginVertical: 10,
              },
            ]}
            onPress={() => navigation.navigate('WordScreen', { wordId: item.word_id })}
          >
            <Text style={styles.optionTitle}>{item.word}</Text>
          </TouchableOpacity>
        )}
      />
      <View>
        <BackButton style={{ position: 'absolute', bottom: 20, alignSelf: 'center' }} />
      </View>
    </View>
  );
};

export default WordList;
