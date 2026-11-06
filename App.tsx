import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { c } from './src/theme';
import { ShiftsProvider } from './src/ShiftsContext';
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import WorkScreen from './src/screens/WorkScreen';
import { DataProvider } from './src/DataContext';
import { Gate } from './src/security/Gate';
import DocsScreen from './src/screens/DocsScreen';
const Tab = createBottomTabNavigator();
const icons: Record<string, keyof typeof Ionicons.glyphMap> = { Главная:'home', График:'calendar', Работа:'briefcase', Документы:'document-text' };
export default function App() {
  return (<Gate><DataProvider><ShiftsProvider><NavigationContainer theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: c.bg } }}>
    <StatusBar style="light" />
    <Tab.Navigator screenOptions={({ route }) => ({ headerShown:false, tabBarActiveTintColor:c.accent, tabBarInactiveTintColor:c.dim,
      tabBarStyle:{ backgroundColor:c.card, borderTopColor:c.border }, tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} /> })}>
      <Tab.Screen name="Главная" component={HomeScreen} /><Tab.Screen name="График" component={ScheduleScreen} />
      <Tab.Screen name="Работа" component={WorkScreen} /><Tab.Screen name="Документы" component={DocsScreen} />
    </Tab.Navigator></NavigationContainer></ShiftsProvider></DataProvider></Gate>);
}
