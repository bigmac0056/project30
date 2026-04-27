import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { PH, FONTS } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  home: 'M3 11l9-8 9 8M5 9v11h14V9',
  play: 'M5 4v16l14-8z',
  progress: 'M3 19h18M6 16V9m4 7v-4m4 4V6m4 10v-7',
  settings: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0',
};

function TabIcon({ route, focused }) {
  const d = TAB_ICONS[route.name] || TAB_ICONS.home;
  const color = focused ? PH.ink : PH.inkFaint;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: PH.ink,
        tabBarInactiveTintColor: PH.inkFaint,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ focused }) => <TabIcon route={route} focused={focused} />,
      })}
    >
      <Tab.Screen name="home" component={HomeScreen} options={{ tabBarLabel: 'Главная' }} />
      <Tab.Screen name="play" component={CatalogScreen} options={{ tabBarLabel: 'Игры' }} />
      <Tab.Screen name="progress" component={ProgressScreen} options={{ tabBarLabel: 'Прогресс' }} />
      <Tab.Screen name="settings" component={SettingsScreen} options={{ tabBarLabel: 'Профиль' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(245,242,236,0.97)',
    borderTopColor: PH.hair,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 26,
    height: 84,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
