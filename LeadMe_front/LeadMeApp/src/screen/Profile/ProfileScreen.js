import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage
import Logo from '../../components/Logo';
import BackButton from '../../components/BackButton';
import Icon from '../../icons/profile_icons.svg'
import UnSubscribeModal from '../../components/UnSubscribeModal';

const ProfileScreen = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      // AsyncStorage에서 access_token 삭제
      await AsyncStorage.removeItem('access_token');
      console.log('로그아웃 성공');
      
      // 로그인 화면으로 네비게이션
      navigation.navigate('Login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 모달 열기
  const openModal = () => {
    setIsModalVisible(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
        <Logo />
        <Icon width={80} height={80}/>
        <Text style = {styles.menuText} marginBottom ={10}> 프로필 </Text>
        <View style={styles.menuContainer}>
        <TouchableOpacity
         style={styles.menuItem}
         onPress = {() => navigation.navigate('FavoriteWordsScreen')}
        >
          <Text style={styles.menuText}>단어 즐겨찾기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SpeedListScreen')}>
          <Text style={styles.menuText}>나의 발화 속도 기록</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfileScreen')}>
          <Text style={styles.menuText}>회원정보 수정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={styles.menuText}>로그아웃</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={openModal}>
          <Text style={styles.menuText}>회원탈퇴</Text>
        </TouchableOpacity>

        {isModalVisible && (
          <UnSubscribeModal
            visible={isModalVisible}
            onClose={closeModal}
            navigation={navigation}
          />
        )}  
      </View>
      <BackButton />
    </View>
  );
};

export default ProfileScreen;
