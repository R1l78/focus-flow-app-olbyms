
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Event } from '@/types';
import { saveEvents, loadEvents, generateId, formatDate, formatTime } from '@/utils/storage';

const COLORS = [
  '#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C',
  '#FFA07A', '#20B2AA', '#87CEFA', '#DEB887', '#F5DEB3'
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Generate hours from 6 AM to 11 PM
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

export default function ScheduleScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Form state
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    loadEventsFromStorage();
    
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadEventsFromStorage = async () => {
    const loadedEvents = await loadEvents();
    setEvents(loadedEvents);
    console.log('Events loaded in schedule:', loadedEvents.length);
  };

  const saveEventsToStorage = async (newEvents: Event[]) => {
    await saveEvents(newEvents);
    setEvents(newEvents);
    console.log('Events saved in schedule:', newEvents.length);
  };

  const addEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'événement');
      return;
    }

    const newEvent: Event = {
      id: generateId(),
      title: title.trim(),
      color: selectedColor,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedEvents = [...events, newEvent];
    await saveEventsToStorage(updatedEvents);
    
    // Reset form
    setTitle('');
    setSelectedColor(COLORS[0]);
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 60 * 60 * 1000));
    setIsRecurring(false);
    setShowAddModal(false);
    
    console.log('Event added:', newEvent);
  };

  const deleteEvent = async (eventId: string) => {
    console.log('Delete event called for:', eventId);
    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting event:', eventId);
            const updatedEvents = events.filter(event => event.id !== eventId);
            await saveEventsToStorage(updatedEvents);
            console.log('Event deleted successfully');
          },
        },
      ]
    );
  };

  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = formatDate(date);
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventDateStr = formatDate(eventDate);
      
      if (eventDateStr === dateStr) return true;
      
      // Handle recurring events
      if (event.isRecurring && event.recurrenceType) {
        const eventStartDate = new Date(event.startTime);
        const daysDiff = Math.floor((date.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (event.recurrenceType) {
          case 'daily':
            return daysDiff >= 0;
          case 'weekly':
            return daysDiff >= 0 && daysDiff % 7 === 0;
          case 'monthly':
            return daysDiff >= 0 && date.getDate() === eventStartDate.getDate();
          default:
            return false;
        }
      }
      
      return false;
    });
  };

  const getWeekDates = (date: Date): Date[] => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    
    return week;
  };

  const getCurrentTimePosition = (): number => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours < 6 || hours > 23) return -1; // Outside visible hours
    
    const hourIndex = hours - 6;
    const minutePercentage = minutes / 60;
    return (hourIndex + minutePercentage) * 60; // 60px per hour
  };

  const isToday = (date: Date): boolean => {
    return formatDate(date) === formatDate(new Date());
  };

  const renderTimeGrid = () => {
    const dayEvents = getEventsForDate(selectedDate);
    const currentTimePosition = getCurrentTimePosition();
    const showCurrentTimeLine = isToday(selectedDate) && currentTimePosition >= 0;
    
    return (
      <View style={styles.timeGrid}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.timeGridContent}>
            {HOURS.map((hour) => (
              <View key={hour} style={styles.timeSlot}>
                <View style={styles.timeLabel}>
                  <Text style={styles.timeLabelText}>{hour}h</Text>
                </View>
                <View style={styles.timeSlotContent}>
                  <View style={styles.timeSlotLine} />
                  {/* Events for this hour */}
                  {dayEvents
                    .filter(event => {
                      const eventStart = new Date(event.startTime);
                      return eventStart.getHours() === hour;
                    })
                    .map(event => {
                      const eventStart = new Date(event.startTime);
                      const eventEnd = new Date(event.endTime);
                      const startMinutes = eventStart.getMinutes();
                      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60); // minutes
                      const height = Math.max((duration / 60) * 60, 30); // Minimum 30px height
                      
                      return (
                        <View
                          key={event.id}
                          style={[
                            styles.timeGridEvent,
                            {
                              backgroundColor: event.color,
                              top: startMinutes,
                              height: height,
                            }
                          ]}
                        >
                          <View style={styles.eventContent}>
                            <View style={styles.eventInfo}>
                              <Text style={styles.timeGridEventTitle} numberOfLines={2}>
                                {event.title}
                              </Text>
                              <Text style={styles.timeGridEventTime}>
                                {formatTime(eventStart)} - {formatTime(eventEnd)}
                              </Text>
                              {event.isRecurring && (
                                <Text style={styles.timeGridEventRecurrence}>🔄</Text>
                              )}
                            </View>
                            <TouchableOpacity
                              style={styles.eventDeleteButton}
                              onPress={() => deleteEvent(event.id)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <IconSymbol name="trash" size={14} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                </View>
              </View>
            ))}
            
            {/* Current time indicator */}
            {showCurrentTimeLine && (
              <View 
                style={[
                  styles.currentTimeLine,
                  { top: currentTimePosition + 20 } // Offset for header
                ]}
              >
                <View style={styles.currentTimeCircle} />
                <View style={styles.currentTimeLineBar} />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderEvent = (event: Event) => (
    <View
      key={event.id}
      style={[styles.eventCard, { backgroundColor: event.color }]}
    >
      <View style={styles.eventCardHeader}>
        <View style={styles.eventCardInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>
            {formatTime(new Date(event.startTime))} - {formatTime(new Date(event.endTime))}
          </Text>
          {event.isRecurring && (
            <Text style={styles.eventRecurrence}>
              🔄 {event.recurrenceType === 'daily' ? 'Quotidien' : 
                   event.recurrenceType === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.eventCardDeleteButton}
          onPress={() => deleteEvent(event.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="trash" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDayView = () => {
    return (
      <View style={styles.dayView}>
        <Text style={[commonStyles.subtitle, styles.dateHeader]}>
          {selectedDate.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        
        {renderTimeGrid()}
      </View>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(selectedDate);
    
    return (
      <View style={styles.weekView}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weekDates.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentDay = isToday(date);
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayColumn, isCurrentDay && styles.todayColumn]}
                onPress={() => {
                  setSelectedDate(date);
                  setViewMode('day');
                }}
              >
                <Text style={[styles.dayHeader, isCurrentDay && styles.todayText]}>
                  {DAYS_OF_WEEK[index]}
                </Text>
                <Text style={[styles.dateNumber, isCurrentDay && styles.todayText]}>
                  {date.getDate()}
                </Text>
                
                <ScrollView style={styles.dayEvents}>
                  {dayEvents
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map(event => (
                      <View
                        key={event.id}
                        style={[styles.weekEventCard, { backgroundColor: event.color }]}
                      >
                        <View style={styles.weekEventContent}>
                          <View style={styles.weekEventInfo}>
                            <Text style={styles.weekEventTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={styles.weekEventTime}>
                              {formatTime(new Date(event.startTime))}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.weekEventDeleteButton}
                            onPress={() => deleteEvent(event.id)}
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                          >
                            <IconSymbol name="trash" size={12} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </ScrollView>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={commonStyles.title}>🕒 Emploi du temps</Text>
        
        <View style={styles.headerControls}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'day' && styles.activeToggle]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[styles.toggleText, viewMode === 'day' && styles.activeToggleText]}>
                Jour
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'week' && styles.activeToggle]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.toggleText, viewMode === 'week' && styles.activeToggleText]}>
                Semaine
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() - (viewMode === 'week' ? 7 : 1));
            setSelectedDate(newDate);
          }}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => setSelectedDate(new Date())}
        >
          <Text style={commonStyles.buttonTextLight}>Aujourd'hui</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() + (viewMode === 'week' ? 7 : 1));
            setSelectedDate(newDate);
          }}
        >
          <IconSymbol name="chevron.right" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {viewMode === 'day' ? renderDayView() : renderWeekView()}
      </View>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[commonStyles.container, styles.modalContainer]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={commonStyles.subtitle}>Nouvel événement</Text>
            <TouchableOpacity onPress={addEvent}>
              <Text style={styles.saveButton}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={commonStyles.text}>Titre</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Nom de l'événement"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Color Selection */}
            <View style={styles.formGroup}>
              <Text style={commonStyles.text}>Couleur</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorPicker}>
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColor
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.formGroup}>
              <Text style={commonStyles.text}>Heure de début</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={commonStyles.text}>{formatTime(startTime)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={commonStyles.text}>Heure de fin</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={commonStyles.text}>{formatTime(endTime)}</Text>
              </TouchableOpacity>
            </View>

            {/* Recurring */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <View style={[styles.checkbox, isRecurring && styles.checkedBox]}>
                  {isRecurring && <IconSymbol name="checkmark" size={16} color="white" />}
                </View>
                <Text style={commonStyles.text}>Répéter</Text>
              </TouchableOpacity>
            </View>

            {isRecurring && (
              <View style={styles.formGroup}>
                <Text style={commonStyles.text}>Fréquence</Text>
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
                        recurrenceType === option.key && styles.selectedRecurrence
                      ]}
                      onPress={() => setRecurrenceType(option.key as any)}
                    >
                      <Text style={[
                        commonStyles.text,
                        recurrenceType === option.key && styles.selectedRecurrenceText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Time Pickers */}
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedTime) => {
                setShowStartTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  setStartTime(selectedTime);
                  // Auto-adjust end time to be 1 hour later
                  const newEndTime = new Date(selectedTime.getTime() + 60 * 60 * 1000);
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
              onChange={(event, selectedTime) => {
                setShowEndTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  setEndTime(selectedTime);
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    color: colors.text,
  },
  activeToggleText: {
    color: 'white',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  todayButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dayView: {
    flex: 1,
  },
  dateHeader: {
    textAlign: 'center',
    marginVertical: 16,
    textTransform: 'capitalize',
  },
  timeGrid: {
    flex: 1,
    position: 'relative',
  },
  timeGridContent: {
    position: 'relative',
  },
  timeSlot: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeLabel: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  timeLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timeSlotContent: {
    flex: 1,
    position: 'relative',
  },
  timeSlotLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  timeGridEvent: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 6,
    padding: 6,
    ...commonStyles.shadow,
    zIndex: 1,
  },
  eventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
    marginRight: 8,
  },
  timeGridEventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timeGridEventTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  timeGridEventRecurrence: {
    fontSize: 10,
    position: 'absolute',
    top: 2,
    right: 4,
  },
  eventDeleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...commonStyles.shadow,
  },
  currentTimeLine: {
    position: 'absolute',
    left: 60,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  currentTimeCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginLeft: -4,
  },
  currentTimeLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#FF0000',
  },
  eventsContainer: {
    flex: 1,
  },
  noEvents: {
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...commonStyles.shadow,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  eventRecurrence: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  eventCardDeleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...commonStyles.shadow,
  },
  weekView: {
    flex: 1,
    paddingVertical: 16,
  },
  dayColumn: {
    width: 120,
    marginRight: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    ...commonStyles.shadow,
  },
  todayColumn: {
    backgroundColor: colors.highlight,
  },
  dayHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  todayText: {
    color: colors.primary,
  },
  dayEvents: {
    flex: 1,
  },
  weekEventCard: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  weekEventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weekEventInfo: {
    flex: 1,
    marginRight: 4,
  },
  weekEventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  weekEventTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  weekEventDeleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    marginTop: 8,
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
  selectedColor: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  timeButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.card,
    marginTop: 8,
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
    borderColor: colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: colors.primary,
  },
  recurrenceOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  recurrenceOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  selectedRecurrence: {
    backgroundColor: colors.primary,
  },
  selectedRecurrenceText: {
    color: 'white',
    fontWeight: '600',
  },
});
