import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUpScreen from './src/screen/SignUpScreen';
import LoginScreen from './src/screen/LoginScreen';
import EditProfileScreen from './src/screen/EditProfileScreen';
import SignUpSuccess from './src/screen/SignUpSuccess';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options = {{headerShown: false}} />
        <Stack.Screen name="SignUpSuccess" component={SignUpSuccess} options = {{headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}