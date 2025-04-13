import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BackButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
      <Text style={styles.backText}>뒤로 가기</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    backBtn: {
      position: 'absolute',
      bottom : 20,
        backgroundColor: '#2ECC71',
        padding: 14,
        width: '100%',
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
      },
    backText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default BackButton;
