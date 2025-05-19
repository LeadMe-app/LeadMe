import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import Logo from '../../components/Logo';
import BackButton from '../../components/BackButton';
import axiosInstance from '../../config/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {styles} from './styles';

const SpeedListScreen = () => {
  const [speedRecords, setSpeedRecords] = useState([]);

  useEffect(() => {
    const fetchSpeedRecords = async () => {
        try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('access_token');

        const response = await axiosInstance.get('/api/speed/analysis/', {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_id: userId },
        });

        const formattedRecords = response.data.map((item) => ({
            speed: item.spm,
            date: new Date(item.analysis_date).toLocaleDateString('ko-KR'),
        }));

        setSpeedRecords(formattedRecords);
        } catch (error) {
        console.error('발화 속도 가져오기 실패:', error);
        }
    };

    fetchSpeedRecords();
    }, []);


  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.speed}</Text>
      <Text style={styles.cell}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={styles.title}>나의 발화 속도 기록</Text>

      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={styles.headerCell}>속도</Text>
          <Text style={styles.headerCell}>날짜</Text>
        </View>

        <FlatList
          data={speedRecords}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>기록이 없습니다.</Text>
          }
        />
      </View>

      <BackButton style={styles.backButton} />
    </View>
  );
};

export default SpeedListScreen;
