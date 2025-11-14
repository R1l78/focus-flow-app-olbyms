
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  card: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  highlight: string;
  error: string;
  success: string;
  warning: string;
}

export const lightTheme: ThemeColors = {
  bg: '#F5F1E3',
  text: '#1E3A5F',
  accent: '#A7C7E7',
  card: '#FFFFFF',
  textSecondary: '#7F8C8D',
  primary: '#26A69A',
  secondary: '#80CBC4',
  highlight: '#E0F2F1',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
};

export const darkTheme: ThemeColors = {
  bg: '#0E1A2B',
  text: '#F5E8C7',
  accent: '#89A7C1',
  card: '#1A2942',
  textSecondary: '#A0AEC0',
  primary: '#4DB8AC',
  secondary: '#6BCFC7',
  highlight: '#2A3F5F',
  error: '#FF6B6B',
  success: '#51CF66',
  warning: '#FFA94D',
};

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@focusflow_theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
        console.log('Theme loaded:', savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      console.log('Theme toggled to:', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
