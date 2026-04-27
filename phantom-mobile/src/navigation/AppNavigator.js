import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PH } from '../constants/theme';
import TabNavigator from './TabNavigator';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CalibrationScreen from '../screens/CalibrationScreen';
import GameSparrowScreen from '../screens/GameSparrowScreen';
import GamePulseRunScreen from '../screens/GamePulseRunScreen';
import GameSteadyClimbScreen from '../screens/GameSteadyClimbScreen';
import ResultsScreen from '../screens/ResultsScreen';
import DoctorPDFScreen from '../screens/DoctorPDFScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: PH.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={PH.lime} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? 'Main' : 'Onboarding'}
    >
      {/* Auth screens — только для незалогиненных */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
      {/* App screens */}
      <Stack.Screen name="Calibration" component={CalibrationScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="GameSparrow" component={GameSparrowScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="GamePulseRun" component={GamePulseRunScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="GameSteadyClimb" component={GameSteadyClimbScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Results" component={ResultsScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DoctorPDF" component={DoctorPDFScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
