import React from 'react';
import { View, Text, TouchableOpacity,  } from 'react-native';
import { styles } from './styles';
import Logo from '../../components/Logo';
import Icon from '../../icons/home_icons.svg'

const HomeScreen = ({ route, navigation }) => {
    const { nickname } = route.params;
    return (
    <View style={styles.container}>
      <Logo/>
      
      <View style={styles.welcomeBox}>
        <Icon width={80} height={80} marginRight={15}/>
        <View>
        <Text style={styles.greeting}>
         <Text  ext style={styles.nickname}>{nickname}</Text> 님 반갑습니다.
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

      <TouchableOpacity style={styles.questionBox}>
        <Text style={styles.questionText}>리드미란?</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
