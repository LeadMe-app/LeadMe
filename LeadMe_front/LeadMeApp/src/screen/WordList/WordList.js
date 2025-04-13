import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import BackButton from '../../components/BackButton';
import {styles} from './styles';
import Logo from '../../components/Logo';

const WordList = ({navigation}) => {
    return (
        <View style = {styles.container}>
            <Logo/>
            
            <TouchableOpacity
            style = {[styles.optionBox, {backgroundColor: '#FFD3A5'}]}
            onPress = {() => navigation.navigate('Rabbit')}>
            <Text style = {styles.optionTitle}>토끼</Text>

            </TouchableOpacity>
            <BackButton />
        </View>
    )
}

export default WordList;
