import React from 'react';
import { Text, StyleSheet } from 'react-native';

const Logo = () => {
  return <Text style={styles.title}>LEAD ME</Text>
};

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8E44AD',
        marginBottom: 40,
        textAlign: 'center',
    },
});

export default Logo;
