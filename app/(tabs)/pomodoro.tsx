
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = '@focusflow_pomodoro';

interface PomodoroState {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  cyclesCompleted: number;
}

type TimerMode = 'work' | 'break' | 'longBreak';

export default function PomodoroScreen() {
  const { colors } = useTheme();
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(workDuration * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const loadState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const state: PomodoroState = JSON.parse(savedState);
        setWorkDuration(state.workDuration);
        setBreakDuration(state.breakDuration);
        setLongBreakDuration(state.longBreakDuration);
        setCyclesCompleted(state.cyclesCompleted);
        setTimeLeft(state.workDuration * 60);
        console.log('Pomodoro state loaded');
      }
    } catch (error) {
      console.error('Error loading pomodoro state:', error);
    }
  };

  const saveState = async () => {
    try {
      const state: PomodoroState = {
        workDuration,
        breakDuration,
        longBreakDuration,
        cyclesCompleted,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('Pomodoro state saved');
    } catch (error) {
      console.error('Error saving pomodoro state:', error);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // Vibrate and haptic feedback
    Vibration.vibrate([0, 200, 100, 200]);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (mode === 'work') {
      const newCycles = cyclesCompleted + 1;
      setCyclesCompleted(newCycles);
      
      if (newCycles % 4 === 0) {
        // Long break after 4 cycles
        setMode('longBreak');
        setTimeLeft(longBreakDuration * 60);
        Alert.alert('🌴 Temps pour une longue pause !', `Tu as complété ${newCycles} cycles. Prends ${longBreakDuration} minutes de repos.`);
      } else {
        // Short break
        setMode('break');
        setTimeLeft(breakDuration * 60);
        Alert.alert('☕ Temps pour une pause !', `Prends ${breakDuration} minutes de repos.`);
      }
    } else {
      // Back to work
      setMode('work');
      setTimeLeft(workDuration * 60);
      Alert.alert('🧠 Retour au travail !', `Concentre-toi pendant ${workDuration} minutes.`);
    }
    
    await saveState();
  };

  const handleStartPause = async () => {
    setIsRunning(!isRunning);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleReset = async () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(workDuration * 60);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const adjustDuration = (type: 'work' | 'break' | 'longBreak', delta: number) => {
    if (type === 'work') {
      const newDuration = Math.max(1, Math.min(60, workDuration + delta));
      setWorkDuration(newDuration);
      if (mode === 'work' && !isRunning) {
        setTimeLeft(newDuration * 60);
      }
    } else if (type === 'break') {
      const newDuration = Math.max(1, Math.min(30, breakDuration + delta));
      setBreakDuration(newDuration);
      if (mode === 'break' && !isRunning) {
        setTimeLeft(newDuration * 60);
      }
    } else {
      const newDuration = Math.max(5, Math.min(60, longBreakDuration + delta));
      setLongBreakDuration(newDuration);
      if (mode === 'longBreak' && !isRunning) {
        setTimeLeft(newDuration * 60);
      }
    }
    saveState();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeIcon = (): string => {
    switch (mode) {
      case 'work':
        return '🧠';
      case 'break':
        return '☕';
      case 'longBreak':
        return '🌴';
    }
  };

  const getModeTitle = (): string => {
    switch (mode) {
      case 'work':
        return 'Focus';
      case 'break':
        return 'Pause';
      case 'longBreak':
        return 'Longue Pause';
    }
  };

  const progress = mode === 'work' 
    ? 1 - (timeLeft / (workDuration * 60))
    : mode === 'break'
    ? 1 - (timeLeft / (breakDuration * 60))
    : 1 - (timeLeft / (longBreakDuration * 60));

  // Adjust icon sizes for Android
  const iconSize = Platform.OS === 'android' ? 20 : 28;
  const mainIconSize = Platform.OS === 'android' ? 24 : 32;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>⏰ Pomodoro</Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.card }]}
          onPress={() => setShowSettings(!showSettings)}
        >
          <IconSymbol name="gear" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Settings Panel */}
      {showSettings && (
        <View style={[styles.settingsPanel, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Travail (min)</Text>
            <View style={styles.settingControls}>
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: colors.highlight }]}
                onPress={() => adjustDuration('work', -5)}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>-5</Text>
              </TouchableOpacity>
              <Text style={[styles.settingValue, { color: colors.text }]}>{workDuration}</Text>
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: colors.highlight }]}
                onPress={() => adjustDuration('work', 5)}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>+5</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Pause (min)</Text>
            <View style={styles.settingControls}>
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: colors.highlight }]}
                onPress={() => adjustDuration('break', -1)}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>-1</Text>
              </TouchableOpacity>
              <Text style={[styles.settingValue, { color: colors.text }]}>{breakDuration}</Text>
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: colors.highlight }]}
                onPress={() => adjustDuration('break', 1)}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Longue pause (min)</Text>
            <View style={styles.settingControls}>
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: colors.highlight }]}
                onPress={() => adjustDuration('longBreak', -5)}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>-5</Text>
              </TouchableOpacity>
              <Text style={[styles.settingValue, { color: colors.text }]}>{longBreakDuration}</Text>
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: colors.highlight }]}
                onPress={() => adjustDuration('longBreak', 5)}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>+5</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={[styles.modeIcon]}>{getModeIcon()}</Text>
        <Text style={[styles.modeTitle, { color: colors.text }]}>{getModeTitle()}</Text>
        
        <View style={[styles.timerCircle, { borderColor: colors.accent }]}>
          <View
            style={[
              styles.progressCircle,
              {
                borderColor: colors.primary,
                transform: [{ rotate: `${progress * 360}deg` }],
              },
            ]}
          />
          <View style={[styles.timerInner, { backgroundColor: colors.bg }]}>
            <Text style={[styles.timerText, { color: colors.text }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        <View style={styles.cyclesContainer}>
          <Text style={[styles.cyclesText, { color: colors.textSecondary }]}>
            Cycles complétés: {cyclesCompleted}
          </Text>
          <Text style={[styles.cyclesSubtext, { color: colors.textSecondary }]}>
            {cyclesCompleted % 4 === 0 && cyclesCompleted > 0
              ? 'Prochaine: Longue pause'
              : `Prochaine longue pause dans ${4 - (cyclesCompleted % 4)} cycle(s)`}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton, { backgroundColor: colors.card }]}
          onPress={handleReset}
        >
          <IconSymbol name="arrow.clockwise" size={iconSize} color={colors.text} />
          <Text style={[styles.controlButtonText, { color: colors.text }]}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.mainButton,
            { backgroundColor: isRunning ? colors.warning : colors.primary },
          ]}
          onPress={handleStartPause}
        >
          <IconSymbol
            name={isRunning ? 'pause.fill' : 'play.fill'}
            size={mainIconSize}
            color="white"
          />
          <Text style={styles.mainButtonText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.skipButton, { backgroundColor: colors.card }]}
          onPress={() => {
            handleTimerComplete();
          }}
        >
          <IconSymbol name="forward.fill" size={iconSize} color={colors.text} />
          <Text style={[styles.controlButtonText, { color: colors.text }]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsPanel: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modeIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 32,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#26A69A',
  },
  timerInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
  },
  cyclesContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  cyclesText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cyclesSubtext: {
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
  },
  resetButton: {
    width: 80,
    height: 80,
  },
  mainButton: {
    width: 100,
    height: 100,
  },
  skipButton: {
    width: 80,
    height: 80,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  mainButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
  },
});
