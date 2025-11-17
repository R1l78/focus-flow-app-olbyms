
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Event } from '@/types';
import { saveEvents, loadEvents, generateId, formatDate, formatTime } from '@/utils/storage';
import AddEventModal from '@/components/AddEventModal';

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_SLOT_HEIGHT = 60;
const WEEK_SLOT_HEIGHT = 50;
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

export default function ScheduleScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadEventsFromStorage();
    
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

  const addEvent = async (eventData: Omit<Event, 'id' | 'createdAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const updatedEvents = [...events, newEvent];
    await saveEventsToStorage(updatedEvents);
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
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    
    return week;
  };

  const getCurrentTimePositionDay = (): number => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours < 6 || hours > 23) return -1;

    const hoursSince6AM = hours - 6;
    const minutePercentage = minutes / 60;
    const totalHours = hoursSince6AM + minutePercentage;
    
    return totalHours * DAY_SLOT_HEIGHT;
  };

  const getCurrentTimePositionWeek = (): number => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours < 6 || hours > 23) return -1;

    const hoursSince6AM = hours - 6;
    const minutePercentage = minutes / 60;
    const totalHours = hoursSince6AM + minutePercentage;
    
    return totalHours * WEEK_SLOT_HEIGHT;
  };

  const isToday = (date: Date): boolean => {
    return formatDate(date) === formatDate(new Date());
  };

  const renderTimeGrid = () => {
    const dayEvents = getEventsForDate(selectedDate);
    const currentTimePosition = getCurrentTimePositionDay();
    const showCurrentTimeLine = isToday(selectedDate) && currentTimePosition >= 0;
    
    return (
      <View style={styles.timeGrid}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.timeGridContent}>
            {HOURS.map((hour) => (
              <View key={hour} style={[styles.timeSlot, { height: DAY_SLOT_HEIGHT }]}>
                <View style={[styles.timeLabel, { backgroundColor: colors.card, borderRightColor: colors.accent }]}>
                  <Text style={[styles.timeLabelText, { color: colors.textSecondary }]}>{hour}h</Text>
                </View>
                <View style={styles.timeSlotContent}>
                  <View style={[styles.timeSlotLine, { backgroundColor: colors.accent }]} />
                  {dayEvents
                    .filter(event => {
                      const eventStart = new Date(event.startTime);
                      return eventStart.getHours() === hour;
                    })
                    .map(event => {
                      const eventStart = new Date(event.startTime);
                      const eventEnd = new Date(event.endTime);
                      const startMinutes = eventStart.getMinutes();
                      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
                      const height = Math.max((duration / 60) * DAY_SLOT_HEIGHT, 30);
                      
                      return (
                        <View
                          key={event.id}
                          style={[
                            styles.timeGridEvent,
                            {
                              backgroundColor: event.color,
                              top: (startMinutes / 60) * DAY_SLOT_HEIGHT,
                              height: height,
                            }
                          ]}
                        >
                          <View style={styles.eventContent}>
                            <View style={styles.eventInfo}>
                              <Text style={[styles.timeGridEventTitle, { color: colors.text }]} numberOfLines={2}>
                                {event.title}
                              </Text>
                              <Text style={[styles.timeGridEventTime, { color: colors.textSecondary }]}>
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
            
            {showCurrentTimeLine && (
              <View 
                style={[
                  styles.currentTimeLine,
                  { top: currentTimePosition }
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

  const renderWeekTimeGrid = (date: Date, dayIndex: number) => {
    const dayEvents = getEventsForDate(date);
    const currentTimePosition = getCurrentTimePositionWeek();
    const showCurrentTimeLine = isToday(date) && currentTimePosition >= 0;

    return (
      <View style={styles.weekDayTimeGrid}>
        <View style={styles.weekTimeGridContent}>
          {HOURS.map((hour) => (
            <View key={hour} style={[styles.weekTimeSlot, { height: WEEK_SLOT_HEIGHT }]}>
              <View style={styles.weekTimeSlotContent}>
                <View style={[styles.weekTimeSlotLine, { backgroundColor: colors.accent }]} />
                {dayEvents
                  .filter(event => {
                    const eventStart = new Date(event.startTime);
                    return eventStart.getHours() === hour;
                  })
                  .map(event => {
                    const eventStart = new Date(event.startTime);
                    const eventEnd = new Date(event.endTime);
                    const startMinutes = eventStart.getMinutes();
                    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
                    const height = Math.max((durationMinutes / 60) * WEEK_SLOT_HEIGHT, 20);

                    return (
                      <View
                        key={event.id}
                        style={[
                          styles.weekTimeGridEvent,
                          {
                            backgroundColor: event.color,
                            top: (startMinutes / 60) * WEEK_SLOT_HEIGHT,
                            height,
                          }
                        ]}
                      >
                        <View style={styles.weekEventContent}>
                          <View style={styles.weekEventInfo}>
                            <Text style={[styles.weekTimeGridEventTitle, { color: colors.text }]} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={[styles.weekTimeGridEventTime, { color: colors.textSecondary }]}>
                              {formatTime(eventStart)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.weekEventDeleteButton}
                            onPress={() => deleteEvent(event.id)}
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                          >
                            <IconSymbol name="trash" size={10} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>
          ))}

          {showCurrentTimeLine && currentTimePosition >= 0 && (
            <View
              style={[
                styles.weekCurrentTimeLine,
                { top: currentTimePosition + 56 }
              ]}
            >
              <View style={styles.weekCurrentTimeCircle} />
              <View style={styles.weekCurrentTimeLineBar} />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDayView = () => {
    return (
      <View style={styles.dayView}>
        <Text style={[styles.dateHeader, { color: colors.text }]}>
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
      <ScrollView style={styles.weekOuterScroll} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={true}>
        <View style={styles.weekTimeGridContainerRow}>
          <View style={styles.weekTimeLabelsColumn}>
            {HOURS.map((hour) => (
              <View key={hour} style={[styles.weekTimeSlot, { height: WEEK_SLOT_HEIGHT }]}>
                <View style={[styles.weekTimeLabel, { backgroundColor: colors.card, borderRightColor: colors.accent }]}>
                  <Text style={[styles.weekTimeLabelText, { color: colors.textSecondary }]}>{hour}h</Text>
                </View>
              </View>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-start' }}>
            <View style={styles.weekDaysColumns}>
              {weekDates.map((date, dayIndex) => {
                const isCurrentDay = isToday(date);
                return (
                  <View key={dayIndex} style={styles.weekDayColumn}>
                    <View style={[styles.weekDayHeader, isCurrentDay && { backgroundColor: colors.highlight }]}>
                      <Text style={[styles.weekDayHeaderText, { color: colors.text }, isCurrentDay && { color: colors.primary }]}>
                        {DAYS_OF_WEEK[dayIndex]}
                      </Text>
                      <Text style={[styles.weekDateNumber, { color: colors.text }, isCurrentDay && { color: colors.primary }]}>
                        {date.getDate()}
                      </Text>
                    </View>

                    {renderWeekTimeGrid(date, dayIndex)}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.accent }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.goalsTitle, { color: colors.text }]}>🕒 Emploi{"\n"}du temps</Text>
        </View>

        <View style={[styles.headerControls, { flexShrink: 0 }]}>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.card }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeIcon}>{theme === 'light' ? '🌙' : '🌞'}</Text>
          </TouchableOpacity>

          <View style={[styles.viewToggle, { backgroundColor: colors.highlight }]}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'day' && { backgroundColor: colors.primary }]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[styles.toggleText, { color: colors.text }, viewMode === 'day' && styles.activeToggleText]}>
                Jour
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'week' && { backgroundColor: colors.primary }]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.toggleText, { color: colors.text }, viewMode === 'week' && styles.activeToggleText]}>
                Semaine
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

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
          style={[styles.todayButton, { backgroundColor: colors.primary }]}
          onPress={() => setSelectedDate(new Date())}
        >
          <Text style={styles.todayButtonText}>Aujourd'hui</Text>
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

      <View style={styles.content}>
        {viewMode === 'day' ? renderDayView() : renderWeekView()}
      </View>

      <AddEventModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addEvent}
      />
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
    borderBottomWidth: 1,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#26A69A',
  },
  toggleText: {
    fontSize: 14,
  },
  activeToggleText: {
    color: 'white',
    fontWeight: '600',
  },
  addButton: {
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
    fontSize: 18,
    fontWeight: '600',
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
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeLabel: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  timeLabelText: {
    fontSize: 12,
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
  },
  timeGridEvent: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 6,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    marginBottom: 2,
  },
  timeGridEventTime: {
    fontSize: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  weekOuterScroll: {
    flex: 1,
  },
  weekTimeGridContainerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  weekDaysColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  weekTimeLabelsColumn: {
    width: 60,
  },
  weekDayColumn: {
    width: 110,
    marginRight: 1,
    position: 'relative',
  },
  weekDayTimeGrid: {
    flex: 1,
  },
  weekTimeGridContent: {
    position: 'relative',
  },
  weekTimeSlot: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  weekTimeLabel: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  weekTimeLabelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  weekTimeSlotContent: {
    flex: 1,
    position: 'relative',
  },
  weekTimeSlotLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  weekTimeGridEvent: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 4,
    padding: 4,
    zIndex: 1,
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
  weekTimeGridEventTitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 1,
  },
  weekTimeGridEventTime: {
    fontSize: 8,
  },
  weekEventDeleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekCurrentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  weekCurrentTimeCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
    marginLeft: -3,
  },
  weekCurrentTimeLineBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#FF0000',
  },
  weekDayHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  weekDayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  weekDateNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalsTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
    lineHeight: 28,
    flexShrink: 1,
  },
});
