import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUpScreen from './src/screen/SignUpScreen';
import LoginScreen from './src/screen/LoginScreen';
import FindIDScreen from './src/screen/FindIDScreen';
import FindPWScreen from './src/screen/FindPWScreen';
import ResetPWScreen from './src/screen/ResetPWScreen';
import EditProfileScreen from './src/screen/EditProfileScreen';
import SignUpSuccess from './src/screen/SignUpSuccess';
import BackButton from './src/components/BackButton';
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
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options = {{headerShown: false}} />
        <Stack.Screen name="SignUpSuccess" component={SignUpSuccess} options = {{headerShown: false}}/>
        <Stack.Screen name="BackButton" component={BackButton} options = {{headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}