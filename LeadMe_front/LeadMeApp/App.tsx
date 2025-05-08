import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignUpScreen from './src/screen/SignUp/SignUpScreen';
import LoginScreen from './src/screen/Login/LoginScreen';
import FindIDScreen from './src/screen/FindID/FindIDScreen';
import FindPWScreen from './src/screen/FindPW/FindPWScreen';
import ResetPWScreen from './src/screen/ResetPW/ResetPWScreen';
import EditProfileScreen from './src/screen/EditProfile/EditProfileScreen';
import StutteringCategoryData from './src/screen/StutteringCategory/StutteringCategoryData';
import SelectSpeechTypeScreen from './src/screen/SelectSpeechType/SelectSpeechTypeScreen';
import WordList from './src/screen/WordList/WordList';
import HomeScreen from './src/screen/Home/HomeScreen';
import ProfileScreen from './src/screen/Profile/ProfileScreen';
import SentenceSpeech from './src/screen/Sentence/SentenceSpeech';
import FreeSpeechScreen from './src/screen/FreeSpeechScreen/FreeSpeechScreen';
import WordScreen from './src/screen/WordScreen/WordScreen';
import WordSentence from './src/screen/WordSentence/WordSentence';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FindID" component={FindIDScreen} options={{headerShown : false}} />
        <Stack.Screen name="FindPW" component={FindPWScreen} options={{headerShown : false}} />
        <Stack.Screen name="ResetPW" component={ResetPWScreen} options={{headerShown : false}} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options = {{headerShown: false}} />
        <Stack.Screen name="StutteringCategoryData" component={StutteringCategoryData} options = {{headerShown : false}} />
        <Stack.Screen name="SelectSpeechTypeScreen" component={SelectSpeechTypeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WordList" component={WordList} options={{ headerShown: false }} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SentenceSpeech" component={SentenceSpeech} options={{headerShown: false}} />
        <Stack.Screen name="FreeSpeechScreen" component={FreeSpeechScreen} options={{headerShown: false}} />
        <Stack.Screen name="WordScreen" component={WordScreen} options={{headerShown: false}} />
        <Stack.Screen name="WordSentence" component={WordSentence} options={{headerShown: false}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}