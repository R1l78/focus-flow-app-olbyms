
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  // FocusFlow color scheme - light blue/white/pastel green
  background: '#F0F8FF',      // AliceBlue - light background
  backgroundAlt: '#FFFFFF',   // White - card backgrounds
  text: '#2F4F4F',           // DarkSlateGray - main text
  textSecondary: '#696969',   // DimGray - secondary text
  primary: '#ADD8E6',         // LightBlue - primary accent
  secondary: '#B0E57C',       // LightGreen - secondary accent
  accent: '#F5DEB3',          // Wheat - accent color
  card: '#FFFFFF',            // White - card color
  highlight: '#E0FFFF',       // LightCyan - highlight color
  
  // Eisenhower Matrix colors
  urgentImportant: '#FFB6C1',     // LightPink
  importantNotUrgent: '#98FB98',   // PaleGreen
  urgentNotImportant: '#FFE4B5',   // Moccasin
  neitherUrgentNorImportant: '#E6E6FA', // Lavender
  
  // Status colors
  success: '#90EE90',         // LightGreen
  warning: '#FFE4B5',         // Moccasin
  error: '#FFB6C1',           // LightPink
  info: '#87CEEB',            // SkyBlue
};

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  textSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonTextLight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
