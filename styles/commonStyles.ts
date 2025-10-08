
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  // FocusFlow Premium color scheme - beige/turquoise theme
  background: '#FAF7F0',        // Warm beige background
  backgroundAlt: '#FFFFFF',     // White - card backgrounds
  text: '#2C3E50',             // Dark blue-gray - main text
  textSecondary: '#7F8C8D',     // Gray - secondary text
  primary: '#26A69A',           // Turquoise - primary accent
  secondary: '#80CBC4',         // Light turquoise - secondary accent
  accent: '#FFF8DC',            // Cornsilk - accent color
  card: '#FFFFFF',              // White - card color
  highlight: '#E0F2F1',         // Very light turquoise - highlight color
  
  // Eisenhower Matrix colors (softer, premium versions)
  urgentImportant: '#FFCDD2',      // Light red
  importantNotUrgent: '#C8E6C9',   // Light green
  urgentNotImportant: '#FFE0B2',   // Light orange
  neitherUrgentNorImportant: '#E1BEE7', // Light purple
  
  // Status colors
  success: '#4CAF50',           // Green
  warning: '#FF9800',           // Orange
  error: '#F44336',             // Red
  info: '#2196F3',              // Blue
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
