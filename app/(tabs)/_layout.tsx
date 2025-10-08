
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  // Define the tabs configuration for FocusFlow
  const tabs: TabBarItem[] = [
    {
      name: 'schedule',
      route: '/(tabs)/schedule',
      icon: 'calendar',
      label: 'Emploi du temps',
    },
    {
      name: 'priorities',
      route: '/(tabs)/priorities',
      icon: 'square.grid.2x2',
      label: 'Priorités',
    },
    {
      name: 'goals',
      route: '/(tabs)/goals',
      icon: 'target',
      label: 'Objectifs',
    },
  ];

  // Use NativeTabs for iOS, custom FloatingTabBar for Android and Web
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="schedule">
          <Icon sf="calendar" drawable="ic_calendar" />
          <Label>Emploi du temps</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="priorities">
          <Icon sf="square.grid.2x2" drawable="ic_grid" />
          <Label>Priorités</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="goals">
          <Icon sf="target" drawable="ic_target" />
          <Label>Objectifs</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Remove fade animation to prevent black screen flash
        }}
      >
        <Stack.Screen name="schedule" />
        <Stack.Screen name="priorities" />
        <Stack.Screen name="goals" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
