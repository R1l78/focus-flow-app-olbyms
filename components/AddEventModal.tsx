
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Event } from '@/types';
import { formatTime } from '@/utils/storage';

const COLORS = [
  '#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C',
  '#FFA07A', '#20B2AA', '#87CEFA', '#DEB887', '#F5DEB3'
];

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id' | 'createdAt'>) => void;
}

export default function AddEventModal({ visible, onClose, onSave }: AddEventModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    // Combine selected date with start and end times
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(startTime.getHours());
    startDateTime.setMinutes(startTime.getMinutes());
    startDateTime.setSeconds(0);

    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(endTime.getHours());
    endDateTime.setMinutes(endTime.getMinutes());
    endDateTime.setSeconds(0);

    onSave({
      title: title.trim(),
      color: selectedColor,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : undefined,
    });

    // Reset form
    setTitle('');
    setSelectedColor(COLORS[0]);
    setSelectedDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 60 * 60 * 1000));
    setIsRecurring(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.accent }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>Annuler</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nouvel événement</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveButton, { color: colors.primary }]}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Titre</Text>
            <TextInput
              style={[styles.textInput, { 
                borderColor: colors.accent, 
                color: colors.text,
                backgroundColor: colors.card 
              }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Nom de l'événement"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Date Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                borderColor: colors.accent,
                backgroundColor: colors.card 
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={colors.text} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {selectedDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Color Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Couleur</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorPicker}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && { borderColor: colors.text, borderWidth: 3 }
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Time Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Heure de début</Text>
            <TouchableOpacity
              style={[styles.timeButton, { 
                borderColor: colors.accent,
                backgroundColor: colors.card 
              }]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <IconSymbol name="clock" size={20} color={colors.text} />
              <Text style={[styles.timeButtonText, { color: colors.text }]}>
                {formatTime(startTime)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Heure de fin</Text>
            <TouchableOpacity
              style={[styles.timeButton, { 
                borderColor: colors.accent,
                backgroundColor: colors.card 
              }]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <IconSymbol name="clock" size={20} color={colors.text} />
              <Text style={[styles.timeButtonText, { color: colors.text }]}>
                {formatTime(endTime)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recurring */}
          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsRecurring(!isRecurring)}
            >
              <View style={[styles.checkbox, { borderColor: colors.primary }, isRecurring && { backgroundColor: colors.primary }]}>
                {isRecurring && <IconSymbol name="checkmark" size={16} color="white" />}
              </View>
              <Text style={[styles.label, { color: colors.text }]}>Répéter</Text>
            </TouchableOpacity>
          </View>

          {isRecurring && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Fréquence</Text>
              <View style={styles.recurrenceOptions}>
                {[
                  { key: 'daily', label: 'Quotidien' },
                  { key: 'weekly', label: 'Hebdomadaire' },
                  { key: 'monthly', label: 'Mensuel' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.recurrenceOption,
                      { 
                        borderColor: colors.accent,
                        backgroundColor: colors.card 
                      },
                      recurrenceType === option.key && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setRecurrenceType(option.key as any)}
                  >
                    <Text style={[
                      styles.recurrenceText,
                      { color: colors.text },
                      recurrenceType === option.key && { color: 'white', fontWeight: '600' }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) {
                setSelectedDate(date);
              }
            }}
          />
        )}

        {/* Time Pickers */}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, time) => {
              setShowStartTimePicker(Platform.OS === 'ios');
              if (time) {
                setStartTime(time);
                const newEndTime = new Date(time.getTime() + 60 * 60 * 1000);
                setEndTime(newEndTime);
              }
            }}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, time) => {
              setShowEndTimePicker(Platform.OS === 'ios');
              if (time) {
                setEndTime(time);
              }
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurrenceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  recurrenceOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  recurrenceText: {
    fontSize: 14,
  },
});
