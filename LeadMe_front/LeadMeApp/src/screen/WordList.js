import React from 'react';
import {View, TouchableOpacity, Text, TextInput, StyleSheet} from 'react-native';
import BackButton from '../components/BackButton';

const WordList = ({navigation}) => {
    return (
        <View style = {styles.container}>
            <Text style = {styles.title}>Lead Me</Text>
            
            <TouchableOpacity
            style = {[styles.optinBox, {backgroundColor: '#FFD3A5'}]}
            onPress = {() => navigation.navigate('Rabbit')}>
            <Text style = {styles.optionTitle}>토끼</Text>

            </TouchableOpacity>
        </View>
    )
}