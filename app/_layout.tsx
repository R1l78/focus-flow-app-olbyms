
import { Button } from "@/components/button";
import { useColorScheme, Alert } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import React, { useEffect } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import * as SplashScreen from "expo-splash-screen";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { useNetworkState } from "expo-network";
import { useFonts } from "expo-font";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, router } from "expo-router";
import { NotificationService } from "@/utils/notificationService";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const colorScheme = useColorScheme();
  const networkState = useNetworkState();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // Initialize notifications when app loads
      NotificationService.initializeNotifications().catch(error => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <WidgetProvider>
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <SystemBars style="auto" />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              <Stack.Screen name="transparent-modal" options={{ presentation: 'transparentModal' }} />
              <Stack.Screen name="formsheet" options={{ presentation: 'formSheet' }} />
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeProvider>
        </WidgetProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
