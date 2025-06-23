import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import RNFetchBlob from 'rn-fetch-blob';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import { styles } from './styles';
import Logo from '../../components/Logo';
import BackButton from '../../components/BackButton';
import Microphone from '../../icons/microphone_icons.svg';
import Stop from '../../icons/stop_icons.svg';
import Speaker from '../../icons/Speaker_icons.svg';
import HyperModal from '../../components/HyperModal';

const audioRecorderPlayer = new AudioRecorderPlayer();

const HyperScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFilePath, setRecordedFilePath] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [graphUrl, setGraphUrl] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [soundInstance, setSoundInstance] = useState(null);

  useEffect(() => {
    return () => {
      if (soundInstance) {
        soundInstance.stop(() => {
          soundInstance.release();
        });
      }
    };
  }, [soundInstance]);

  const handleRecordPress = async () => {
    setAnalysisResult(null);
    setGraphUrl(null);
    setIsRecording(true);

    try {
      const dirs = RNFetchBlob.fs.dirs;
      const path = Platform.select({
        android: `${dirs.CacheDir}/sound.m4a`,
      });

      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
      };

      const result = await audioRecorderPlayer.startRecorder(path, audioSet);
      setRecordedFilePath(result);
      console.log('녹음 시작:', result);
    } catch (error) {
      console.error('녹음 시작 오류:', error);
      setIsRecording(false);
    }
  };

  const handleStopPress = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      setRecordedFilePath(result);
      console.log('녹음 종료:', result);
      await sendRecordingToServer(result);
    } catch (error) {
      console.error('녹음 중지 오류:', error);
      setIsRecording(false);
    }
  };

  const sendRecordingToServer = async (filePath) => {
    setLoading(true);
    try {
      let correctedUri = filePath;

      if (correctedUri.startsWith('file:////')) {
        correctedUri = correctedUri.replace('file:////', 'file:///');
      }

      if (!correctedUri.startsWith('file://')) {
        correctedUri = `file://${correctedUri}`;
      }

      const mimeType = 'audio/m4a';
      const fileName = 'sound.m4a';

      const formData = new FormData();
      formData.append('file', {
        uri: correctedUri,
        type: mimeType,
        name: fileName,
      });

      const token = await AsyncStorage.getItem('access_token');

      const response = await fetch('http://3.36.186.136:8000/api/speed/analyze-vocal-fatigue/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('서버 응답:', data);
      setAnalysisResult(data);

      if (data.graph_url) {
        console.log('graphUrl:', graphUrl);
        setGraphUrl(data.graph_url.startsWith('http') ? data.graph_url : `http://3.36.186.136:8000${data.graph_url}`);
      } else {
        setGraphUrl(null);
      }
    } catch (error) {
      console.error('서버 업로드 실패:', error);
      Alert.alert('오류', '분석 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  const handlePlayPress = () => {
    if (!recordedFilePath) return;

    const path = Platform.OS === 'android'
      ? recordedFilePath.replace('file://', '')
      : recordedFilePath;

    // 이미 재생 중이면 중지
    if (isPlaying && soundInstance) {
      soundInstance.stop(() => {
        setIsPlaying(false);
        console.log('재생 중지됨');
      });
      return;
    }

    // 새로 재생 시작
    const newSound = new Sound(path, '', (error) => {
      if (error) {
        console.error('재생 초기화 실패:', error);
        return;
      }

      setSoundInstance(newSound);
      newSound.play((success) => {
        if (success) {
          console.log('재생 완료');
        } else {
          console.log('재생 중 오류 발생');
        }
        setIsPlaying(false);
        newSound.release();
      });

      setIsPlaying(true);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Logo />

      <View style={styles.iconRow}>
        {!isRecording ? (
          <>
            <TouchableOpacity onPress={handleRecordPress}>
              <Microphone width={70} height={70} />
              <Text style={styles.iconText}>녹음</Text>
            </TouchableOpacity>

            {recordedFilePath && (
              <TouchableOpacity onPress={handlePlayPress}>
                {isPlaying? (
                  <Stop width = {80} height={80}/>
                ) : (
                  <Speaker width={80} height={80} />
                )}
                <Text style={styles.iconText}>{isPlaying ? '정지' : '재생'}</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity onPress={handleStopPress}>
            <Stop width={80} height={80} />
            <Text style={styles.iconText}>정지</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 분석중 안내문구 */}
      {loading && (
        <View style={{ marginVertical: 10 }}>
          <Text style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
            ⚠️ 분석중입니다. 화면을 나가면 분석이 종료됩니다. 잠시만 기다려주세요.
          </Text>
        </View>
      )}
      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

      {graphUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: graphUrl, cache: 'reload' }} //cache 때문에 한글 깨짐
            style={styles.graphImage}
            resizeMode="contain"
            onError={() => Alert.alert('이미지 오류', '그래프를 불러오지 못했습니다.')}
          />
        </View>
      )}
      <View style={{ marginTop : '60' }}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: '#F8D7A9',
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontWeight: '500' }}>사용방법</Text>
        </TouchableOpacity>
      </View>
      {/* 분리한 모달 컴포넌트 */}
      <HyperModal visible={modalVisible} onClose={() => setModalVisible(false)} />

      <BackButton />
    </ScrollView>
  );
};

export default HyperScreen;
