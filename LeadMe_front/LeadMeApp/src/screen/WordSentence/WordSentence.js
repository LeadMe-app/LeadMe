import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, NativeModules } from 'react-native';
import styles from './styles';
import Logo from '../../components/Logo';
import Speaker from '../../icons/Speaker_icons.svg';
import Micro from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import DAFModal from '../../components/DAFModal';

const { EarphoneModule } = NativeModules;
const { DAFModule } = NativeModules;

const WordSentence = ({ navigation, route }) => {
  const { word, wordId, favorites, currentIndex } = route.params; // ✅ 수정: 즐겨찾기 정보 추가

  const [sentence, setSentence] = useState('');
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDAFRunning, setIsDAFRunning] = useState(false);
  const [ttsSound, setTtsSound] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchSentence = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('access_token');

      const response = await axiosInstance.post(
        '/api/sentence/generate/word',
        { user_id: userId, word },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.sentence) {
        setSentence(response.data.sentence);
      } else {
        Alert.alert('문장 생성 실패', '적절한 문장을 받아오지 못했습니다.');
      }
    } catch (error) {
      console.error('문장 가져오기 실패:', error);
      Alert.alert('오류', '문장을 불러오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchSentence();
  }, [word]);

  const toggleDAF = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const isConnected = await EarphoneModule.isAnyHeadphoneConnected();
      if (!isConnected) {
        Alert.alert(
          '이어폰이 연결되지 않았습니다',
          'DAF 기능을 사용하려면 유선 또는 블루투스 이어폰을 연결해주세요.'
        );
        return;
      }

      if (isDAFRunning) {
        DAFModule.stopDAF();
        setIsDAFRunning(false);
      } else {
        DAFModule.startDAF();
        setIsDAFRunning(true);
      }
    } catch (error) {
      console.error('DAF 토글 오류:', error);
      Alert.alert('오류', 'DAF 기능 실행 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const TextToSpeech = async () => {
    if (isTtsPlaying) {
      if (ttsSound) {
        ttsSound.stop(() => {
          ttsSound.release();
          setTtsSound(null);
          setIsTtsPlaying(false);
        });
      }
      return;
    }

    if (!sentence) {
      Alert.alert('오류', '먼저 문장을 생성해주세요.');
      return;
    }

    try {
      setIsProcessing(true);

      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('access_token');

      const response = await axiosInstance.post(
        '/api/sentence/generate/word/tts',
        { user_id: userId, word },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { tts_url } = response.data;
      const fullUrl = `${axiosInstance.defaults.baseURL}${tts_url}`;

      if (!tts_url) {
        Alert.alert('오류', '음성 파일 경로를 받아오지 못했습니다.');
        return;
      }

      const sound = new Sound(fullUrl, '', (error) => {
        if (error) {
          console.error('음성 파일 로딩 실패:', error);
          Alert.alert('오류', '음성 파일을 재생할 수 없습니다.');
          return;
        }
        setTtsSound(sound);
        setIsTtsPlaying(true);

        sound.play((success) => {
          setIsTtsPlaying(false);
          sound.release();
          setTtsSound(null);

          if (!success) {
            console.error('TTS 재생 실패');
          }
        });
      });

    } catch (error) {
      console.error('TTS 오류:', error);
      Alert.alert('오류', '음성을 재생하는 중 문제가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={styles.sentence}>{sentence || '문장을 불러오는 중...'}</Text>
      <View style={styles.underline} />

      <TouchableOpacity onPress={TextToSpeech}>
        <Speaker width={40} height={40} marginTop={30} />
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <TouchableOpacity onPress={toggleDAF} style={styles.iconWithLabel}>
          {isDAFRunning ? (
            <Stop width={50} height={50} />
          ) : (
            <Micro width={50} height={50} />
          )}
          <Text style={styles.iconLabel}>
            {isDAFRunning ? 'DAF 중지' : 'DAF 시작'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomButtons}>
        {/* ✅ 수정된 부분: 즐겨찾기 정보 유지하며 WordScreen으로 복귀 */}
        <TouchableOpacity
          style={styles.endButton}
          onPress={() =>
            navigation.navigate('WordScreen', {
              wordId,
              favorites,
              currentIndex,
            })
          }
        >
          <Text style={styles.bottomButtonText}>문장연습 종료</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.otherButton} onPress={fetchSentence}>
          <Text style={styles.bottomButtonText}>다른 문장</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#F8D7A9',
          paddingHorizontal: 15,
          paddingVertical: 10,
          borderRadius: 6,
          marginTop: 50,
        }}
        onPress={() => setModalVisible(true)}
      >
        <Text>학습 방법</Text>
      </TouchableOpacity>

      <DAFModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

export default WordSentence;
