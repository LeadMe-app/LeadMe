import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from './styles';
import Logo from '../../components/Logo';
import Icon from '../../icons/home_icons.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LeadMeModal from '../../components/LeadMeModal';

const HomeScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // username 불러오기
  useEffect(() => {
    const loadUserName = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) setUsername(storedUsername);
    };
    loadUserName();
  }, []);

  // 뒤로가기 버튼 핸들링
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('앱 종료', '앱을 종료하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          { text: '종료', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const loadUserName = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) setUsername(storedUsername);
    };

    loadUserName(); // ✅ 포커스될 때마다 username 업데이트

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [])
  );


  return (
    <View style={styles.container}>
      <Logo />

      <View style={styles.welcomeBox}>
        <Icon width={80} height={80} marginRight={15} />
        <View>
          <Text style={styles.greeting}>
            <Text style={styles.nickname}>{username}</Text> 님 반갑습니다.
          </Text>
          <Text style={styles.link} onPress={() => navigation.navigate('ProfileScreen')}>
            학습 내용 확인하기
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#FFD8A9' }]}
        onPress={() => navigation.navigate('SelectSpeechTypeScreen')}
      >
        <Text style={styles.optionTitle}>속화증</Text>
        <Text style={styles.optionSubtitle}>말을 너무 빨리 하는 사람에게 추천.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionBox, { backgroundColor: '#A9D6FD' }]}
        onPress={() => navigation.navigate('StutteringCategoryData')}
      >
        <Text style={styles.optionTitle}>말더듬증</Text>
        <Text style={styles.optionSubtitle}>말을 너무 더듬는 사람에게 추천.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.questionBox}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.questionText}>리드미란?</Text>
      </TouchableOpacity>

      <LeadMeModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

export default HomeScreen;
