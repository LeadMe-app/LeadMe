import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from './styles';
import Logo from '../../components/Logo';
import Speaker from '../../icons/Speaker_icons.svg';
import Micro from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import Play from '../../icons/play_icons.svg';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import SentenceModal from '../../components/SentenceModal';

const SentenceSpeech = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sentence, setSentence] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedPath, setRecordedPath] = useState('');
  const [selectedSpeed, setSelectedSpeed] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [ageGroup, setAgeGroup] = useState('20세 이상');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isManualRecording, setIsManualRecording] = useState(false); // 
  
  const intervalRef = useRef(null);
  const audioRecorderPlayer = useRef(null);

  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const ttsSoundRef = useRef(null);
  const karaokeIndexRef = useRef(0);

   useEffect(() => {
    audioRecorderPlayer.current = new AudioRecorderPlayer();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  const getDelayFromSPS = (sps) => Math.round((1000 / sps) * 0.9);
  // 속도 매핑 (밀리초 단위)
  const speedMap = {
  '5~12세': {
    느림: getDelayFromSPS(2.5),      // 느림 훈련용
    평균: getDelayFromSPS(3.5),      // 평균: 일반 아동 속도
    조금빠름: getDelayFromSPS(4.0),  // 평균을 향한 훈련
    빠름: getDelayFromSPS(5.0),      // 속화증 말하기 수준
  },
  '13~19세': {
    느림: getDelayFromSPS(3.0),
    평균: getDelayFromSPS(4.5),
    조금빠름: getDelayFromSPS(5.0),
    빠름: getDelayFromSPS(6.0),
  },
  '20세 이상': {
    느림: getDelayFromSPS(3.5),
    평균: getDelayFromSPS(5.0),
    조금빠름: getDelayFromSPS(5.5),
    빠름: getDelayFromSPS(6.5),
  },
};

  // 문장을 음절 단위로 쪼갬
  const syllables = Array.from(sentence);
  const karaokeActiveRef = useRef(0);

  // 노래방 애니메이션 시작
  const startKaraokeAnimation = () => {
    karaokeActiveRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHighlightIndex(0);
    setIsAnimating(true);

    const delay = (speedMap[ageGroup] && speedMap[ageGroup][selectedSpeed]) || 300;
    karaokeIndexRef.current = 0;

    const animate = () => {
      if (!karaokeActiveRef.current) return; 
      intervalRef.current = setInterval(() => {
        if (!karaokeActiveRef.current) {
          clearInterval(intervalRef.current);
          return;
        }

        if (karaokeIndexRef.current >= syllables.length) {
          clearInterval(intervalRef.current);
          setTimeout(() => {
            if (karaokeActiveRef.current) {
              karaokeIndexRef.current = 0;
              setHighlightIndex(0);
              animate(); // 반복
            }
          }, 1000);
        } else {
          setHighlightIndex(karaokeIndexRef.current);
          karaokeIndexRef.current += 1;
        }
      }, delay);
    };
    animate();
  };

  // 노래방 애니메이션 종료
  const stopKaraokeAnimation = () => {
    karaokeActiveRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHighlightIndex(-1);
    setIsAnimating(false);
  };

  // 연습 시작/종료 토글 (녹음 + 노래방 효과 동시)
  const handlePracticeToggle = async () => {
     if (!selectedSpeed || selectedSpeed.trim() === '') {
      Alert.alert('알림', '먼저 속도를 선택해주세요.');
      return;
    }
    if (!isPracticing) {
      try {
        const result = await audioRecorderPlayer.current.startRecorder();
        audioRecorderPlayer.current.addRecordBackListener(() => {});
        setRecordedPath(result);
        setIsRecording(true);
        setIsPracticing(true);

        startKaraokeAnimation();
      } catch (e) {
        console.error('녹음 시작 실패:', e);
        Alert.alert('오류', '녹음 시작에 실패했습니다.');
      }
    } else {
      await stopPractice();
    }
  };

  const handlePlayPress = async () => {
    if (recordedPath) {
      const path =
        Platform.OS === 'android'
          ? recordedPath.replace('file://', '')
          : recordedPath;
      console.log('재생할 경로', path);

      const sound = new Sound(path, '', (error) => {
        if (error) {
          console.log('재생 초기화 실패', error);
          return;
        }
        sound.play((success) => {
          if (success) {
            console.log('재생 완료');
          } else {
            console.log('재생 중 오류 발생');
          }
        });
      });
    }
  };

  // 문장 불러오기
  const fetchSentence = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await axiosInstance.post('/api/sentence/generate', {
        user_id: userId,
      });

      if (response.data.sentence) {
        const cleanedSentence = response.data.sentence.replace(/^"(.*)"$/, '$1').replace(/[!,.?"'，。！？、]/g, '');;
        setSentence(cleanedSentence);
      } else {
        Alert.alert('오류', '문장을 불러오지 못했습니다.');
      }
    } catch (error) {
      console.error('문장 불러오기 오류:', error);
      Alert.alert('오류', '문장을 불러오는 중 문제가 발생했습니다.');
    }
  };

  // 유저 연령대 AsyncStorage에서 불러오기
  const fetchAgeGroup = async () => {
    const storedAgeGroup = await AsyncStorage.getItem('age_group');
    if (storedAgeGroup) {
      setAgeGroup(storedAgeGroup);
    }
  };

  useEffect(() => {
    fetchAgeGroup();
    fetchSentence();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // TTS 요청 및 재생 (기존 코드 유지)
  const requestTTSAndPlay = async () => {
    if (isTTSPlaying && ttsSoundRef.current) {
      // 🔇 이미 재생 중이면 정지
      ttsSoundRef.current.stop(() => {
        console.log('TTS 정지');
        ttsSoundRef.current.release();
        ttsSoundRef.current = null;
        setIsTTSPlaying(false);
      });
      return;
    }
    try {
      setIsProcessing(true);
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('access_token');

      const params = new URLSearchParams({
        text: sentence,
        user_id: userId,
        speaker: 'Seoyeon',
        speed: '중간',
        age_group: '13세~19세', // 연령대로 바꾸기
      });

      const response = await axiosInstance.post(
        `/api/tts/text-to-speech/?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { file_url } = response.data;
      if (!file_url) {
        Alert.alert('오류', '음성 파일 경로를 받아오지 못했습니다.');
        return;
      }

      const fullUrl = `${axiosInstance.defaults.baseURL}${file_url}`;
      const sound = new Sound(fullUrl, null, (error) => {
        if (error) {
          console.error('TTS 로딩 실패:', error);
          Alert.alert('오류', 'TTS 재생 실패');
          return;
        }
        ttsSoundRef.current = sound; 
        setIsTTSPlaying(true);   

        sound.play(() => {
          sound.release();
          ttsSoundRef.current = null;
          setIsTTSPlaying(false);  
        });
      });
    } catch (error) {
      console.error('TTS 오류:', error);
      Alert.alert('TTS 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopPractice = async () => {
    try {
      if (audioRecorderPlayer.current) {
        await audioRecorderPlayer.current.stopRecorder();
        audioRecorderPlayer.current.removeRecordBackListener();
      }
    } catch (e) {
      console.error('녹음 종료 실패:', e);
    } finally {
      setIsRecording(false);
      setIsPracticing(false);
      stopKaraokeAnimation();
    }
  };

  return (
    <View style={styles.container}>
      <Logo />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 }}>
        {syllables.length > 0 ? (
          syllables.map((char, idx) => (
            <Text
              key={idx}
              style={{
                ...styles.sentence,
                color: idx === highlightIndex ? '#FF3B30' : '#000',
                fontWeight: idx === highlightIndex ? 'bold' : 'normal',
              }}
            >
              {char}
            </Text>
          ))
        ) : (
          <Text style={styles.sentence}>문장을 불러오는 중...</Text>
        )}
      </View>
         <View style={styles.underline} />
      <View style={styles.topRow}>
        <TouchableOpacity onPress={requestTTSAndPlay} disabled={isProcessing}>
          <Speaker width={40} height={40} />
        </TouchableOpacity>

        <Picker
          selectedValue={selectedSpeed}
          onValueChange={(value) => setSelectedSpeed(value)}
          mode="dropdown"
          style={{
            ...styles.dropdown,
            color: '#000',
            fontFamily: undefined,
          }}
          itemStyle={{ color: '#000' }}
          enabled={!isPracticing}
        >
          <Picker.Item label="원하는 속도를 선택하세요" value=" " enabled={false}/>
          <Picker.Item label="느림" value="느림" />
          <Picker.Item label="평균" value="평균" />
          <Picker.Item label="조금빠름" value="조금빠름" />
          <Picker.Item label="빠름" value="빠름" />
        </Picker>
      </View>

      <TouchableOpacity
        style={isPracticing ? styles.stopButton : styles.startButton}
        onPress={handlePracticeToggle}
      >
        <Text style={styles.practiceButtonText}>
          {isPracticing ? '연습 종료' : '연습 시작'}
        </Text>
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <TouchableOpacity disabled>
          {isRecording ? (
            <Stop width={50} height={50} />
          ) : (
            <Micro width={50} height={50} />
          )}
          <Text style={styles.iconLabel}>{isRecording ? '녹음중' : '녹음'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayPress} style={styles.iconWithLabel}>
          <Play width={50} height={50} />
          <Text style={styles.iconLabel}>재생</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop : '60' }}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: '#F8D7A9',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontWeight: '500' }}>사용방법</Text>
        </TouchableOpacity>
      </View>
      {/* 분리한 모달 컴포넌트 */}
      <SentenceModal visible={modalVisible} onClose={() => setModalVisible(false)} />
            
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.endButton}
          onPress={async () => {
            if (isPracticing) await stopPractice(); // ← 연습 중이면 종료
            navigation.navigate('SelectSpeechTypeScreen');
          }}
        >
        <Text style={styles.bottomButtonText}>치료 종료</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.otherButton}
          onPress={async () => {
            if (isPracticing) await stopPractice(); // ← 연습 중이면 종료
            fetchSentence();
          }}
        >
          <Text style={styles.bottomButtonText}>다른 문장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SentenceSpeech;
