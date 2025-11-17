
import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colors, theme, toggleTheme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.accent,
        },
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity
            onPress={toggleTheme}
            style={{ marginRight: 16, padding: 8 }}
          >
            <IconSymbol
              name={theme === 'light' ? 'moon.fill' : 'sun.max.fill'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Emploi du temps',
          tabBarIcon: ({ color }) => <IconSymbol name="calendar" size={28} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="priorities"
        options={{
          title: 'Priorités',
          tabBarIcon: ({ color }) => <IconSymbol name="square.grid.3x3" size={28} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Objectifs',
          tabBarIcon: ({ color }) => <IconSymbol name="target" size={28} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="pomodoro"
        options={{
          title: 'Pomodoro',
          tabBarIcon: ({ color }) => <IconSymbol name="timer" size={28} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Mémoire',
          tabBarIcon: ({ color }) => <IconSymbol name="lightbulb.fill" size={28} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
