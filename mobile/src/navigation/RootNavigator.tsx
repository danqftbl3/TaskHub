import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../context/store';
import { LoginScreen, SignUpScreen, AuthStackParams } from '../screens/AuthScreens';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { VaultScreen } from '../screens/VaultScreen';
import { TutorScreen } from '../screens/TutorScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Auth = createNativeStackNavigator<AuthStackParams>();
const Tabs = createBottomTabNavigator();
const ICON: Record<string, string> = { Schedule: '🗓', Vault: '📚', Tutor: '💬', Settings: '⚙️' };
const LABEL: Record<string, string> = { Schedule: 'Schedule', Vault: 'Study Vault', Tutor: 'Tutor AI', Settings: 'Settings' };

export function RootNavigator() {
  const t = useTheme(); const hydrated = useStore((s) => s.hydrated); const authed = useStore((s) => !!s.sessionId && s.users.some((u) => u.id === s.sessionId));
  const nav = { ...(t.name === 'dark' ? DarkTheme : DefaultTheme), colors: { ...(t.name === 'dark' ? DarkTheme : DefaultTheme).colors, background: t.background, card: t.card, text: t.text, primary: t.primary, border: t.highlight } };
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.primary} accessibilityLabel="Loading" /></View>;
  return (
    <NavigationContainer theme={nav}>
      {authed ? (
        <Tabs.Navigator screenOptions={({ route }) => ({
          headerShown: false, tabBarActiveTintColor: t.primary, tabBarInactiveTintColor: t.muted,
          tabBarStyle: { backgroundColor: t.card, borderTopColor: t.highlight, minHeight: 60 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 4 },
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICON[route.name]}</Text>,
          tabBarLabel: LABEL[route.name], tabBarAccessibilityLabel: LABEL[route.name],
        })}>
          <Tabs.Screen name="Schedule" component={ScheduleScreen} />
          <Tabs.Screen name="Vault" component={VaultScreen} />
          <Tabs.Screen name="Tutor" component={TutorScreen} />
          <Tabs.Screen name="Settings" component={SettingsScreen} />
        </Tabs.Navigator>
      ) : (
        <Auth.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Auth.Screen name="SignUp" component={SignUpScreen} />
          <Auth.Screen name="Login" component={LoginScreen} />
        </Auth.Navigator>
      )}
    </NavigationContainer>
  );
}
