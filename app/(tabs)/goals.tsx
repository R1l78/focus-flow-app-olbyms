
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Goal, DailyGoalProgress, GoalStats } from '@/types';
import { 
  saveGoals, 
  loadGoals, 
  saveDailyProgress, 
  loadDailyProgress, 
  generateId, 
  formatDate 
} from '@/utils/storage';
import { NotificationService } from '@/utils/notificationService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function GoalsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyGoalProgress[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadData();
    
    NotificationService.initializeNotifications().catch(error => {
      console.error('Failed to initialize notifications in goals screen:', error);
    });
  }, []);

  const loadData = async () => {
    const [loadedGoals, loadedProgress] = await Promise.all([
      loadGoals(),
      loadDailyProgress()
    ]);
    setGoals(loadedGoals);
    setDailyProgress(loadedProgress);
    console.log('Goals and progress loaded:', loadedGoals.length, loadedProgress.length);
  };

  const saveGoalsToStorage = async (newGoals: Goal[]) => {
    await saveGoals(newGoals);
    setGoals(newGoals);
    await NotificationService.updateDailyGoalsNotification();
    console.log('Goals saved:', newGoals.length);
  };

  const saveProgressToStorage = async (newProgress: DailyGoalProgress[]) => {
    await saveDailyProgress(newProgress);
    setDailyProgress(newProgress);
    await NotificationService.updateDailyGoalsNotification();
    console.log('Progress saved:', newProgress.length);
  };

  const addGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'objectif');
      return;
    }

    const newGoal: Goal = {
      id: generateId(),
      title: newGoalTitle.trim(),
      category: newGoalCategory.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [...goals, newGoal];
    await saveGoalsToStorage(updatedGoals);
    
    setNewGoalTitle('');
    setNewGoalCategory('');
    setShowAddModal(false);
    console.log('Goal added:', newGoal);
  };

  const deleteGoal = async (goalId: string) => {
    console.log('Delete goal called for:', goalId);
    Alert.alert(
      'Supprimer l\'objectif',
      'Êtes-vous sûr de vouloir supprimer cet objectif et tout son historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting goal:', goalId);
            const updatedGoals = goals.filter(goal => goal.id !== goalId);
            const updatedProgress = dailyProgress.filter(progress => progress.goalId !== goalId);
            
            await Promise.all([
              saveGoalsToStorage(updatedGoals),
              saveProgressToStorage(updatedProgress)
            ]);
            console.log('Goal deleted successfully');
          },
        },
      ]
    );
  };

  const toggleGoalProgress = async (goalId: string, date: Date) => {
    const dateStr = formatDate(date);
    const existingProgress = dailyProgress.find(
      p => p.goalId === goalId && p.date === dateStr
    );

    let updatedProgress: DailyGoalProgress[];
    
    if (existingProgress) {
      updatedProgress = dailyProgress.map(p =>
        p.goalId === goalId && p.date === dateStr
          ? { ...p, completed: !p.completed }
          : p
      );
    } else {
      const newProgress: DailyGoalProgress = {
        date: dateStr,
        goalId,
        completed: true,
      };
      updatedProgress = [...dailyProgress, newProgress];
    }

    await saveProgressToStorage(updatedProgress);
    console.log('Goal progress toggled:', goalId, dateStr);
  };

  const getGoalProgressForDate = (goalId: string, date: Date): boolean => {
    const dateStr = formatDate(date);
    const progress = dailyProgress.find(
      p => p.goalId === goalId && p.date === dateStr
    );
    return progress?.completed || false;
  };

  const getTodayCompletionRate = (): number => {
    if (goals.length === 0) return 0;
    
    const today = formatDate(selectedDate);
    const completedToday = dailyProgress.filter(
      p => p.date === today && p.completed
    ).length;
    
    return Math.round((completedToday / goals.length) * 100);
  };

  const getGoalStats = (goalId: string): GoalStats => {
    const goalProgress = dailyProgress.filter(p => p.goalId === goalId);
    const completedDays = goalProgress.filter(p => p.completed).length;
    const totalDays = goalProgress.length;
    
    let currentStreak = 0;
    const sortedProgress = goalProgress
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const progress of sortedProgress) {
      if (progress.completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (const progress of sortedProgress.reverse()) {
      if (progress.completed) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    return {
      goalId,
      totalDays,
      completedDays,
      currentStreak,
      longestStreak,
      completionRate,
    };
  };

  const getLastSevenDays = (): Date[] => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const renderProgressChart = () => {
    const lastSevenDays = getLastSevenDays();
    const completionRates = lastSevenDays.map(date => {
      if (goals.length === 0) return 0;
      
      const dateStr = formatDate(date);
      const completedOnDate = dailyProgress.filter(
        p => p.date === dateStr && p.completed
      ).length;
      
      return Math.round((completedOnDate / goals.length) * 100);
    });

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Progression des 7 derniers jours</Text>
        
        <View style={styles.chart}>
          {lastSevenDays.map((date, index) => {
            const rate = completionRates[index];
            const isCurrentDay = formatDate(date) === formatDate(new Date());
            
            return (
              <View key={index} style={styles.chartDay}>
                <View style={[styles.chartBar, { backgroundColor: colors.highlight }]}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${rate}%`,
                        backgroundColor: isCurrentDay ? colors.primary : colors.secondary,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, { color: colors.textSecondary }, isCurrentDay && { color: colors.primary, fontWeight: '600' }]}>
                  {date.getDate()}
                </Text>
                <Text style={[styles.chartPercentage, { color: colors.textSecondary }]}>{rate}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderGoalCard = (goal: Goal) => {
    const isCompleted = getGoalProgressForDate(goal.id, selectedDate);
    const stats = getGoalStats(goal.id);
    
    return (
      <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card }, isCompleted && { backgroundColor: colors.highlight }]}>
        <View style={styles.goalHeader}>
          <TouchableOpacity
            style={styles.goalCheckbox}
            onPress={() => toggleGoalProgress(goal.id, selectedDate)}
          >
            <View style={[styles.checkbox, { borderColor: colors.primary }, isCompleted && { backgroundColor: colors.primary }]}>
              {isCompleted && <IconSymbol name="checkmark" size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <View style={styles.goalInfo}>
            <Text style={[styles.goalTitle, { color: colors.text }, isCompleted && styles.completedGoalTitle]}>
              {goal.title}
            </Text>
            {goal.category && (
              <Text style={[styles.goalCategory, { color: colors.textSecondary, backgroundColor: colors.accent }]}>{goal.category}</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteGoal(goal.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.goalStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.currentStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Série actuelle</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.longestStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Meilleure série</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.completionRate}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taux de réussite</Text>
          </View>
        </View>
        
        <View style={[styles.miniProgressBar, { backgroundColor: colors.highlight }]}>
          <View
            style={[
              styles.miniProgressFill,
              { width: `${stats.completionRate}%`, backgroundColor: colors.primary }
            ]}
          />
        </View>
      </View>
    );
  };

  const renderStatsModal = () => (
    <Modal
      visible={showStatsModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.accent }]}>
          <TouchableOpacity onPress={() => setShowStatsModal(false)}>
            <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>Fermer</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Statistiques détaillées</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <ScrollView style={styles.statsContent}>
          {renderProgressChart()}
          
          <View style={[styles.overallStats, { backgroundColor: colors.card }]}>
            <Text style={[styles.overallStatsTitle, { color: colors.text }]}>Résumé global</Text>
            
            <View style={styles.overallStatsGrid}>
              <View style={[styles.overallStatCard, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.overallStatValue, { color: colors.primary }]}>{goals.length}</Text>
                <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>Objectifs actifs</Text>
              </View>
              
              <View style={[styles.overallStatCard, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.overallStatValue, { color: colors.primary }]}>{getTodayCompletionRate()}%</Text>
                <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>Complétés aujourd'hui</Text>
              </View>
              
              <View style={[styles.overallStatCard, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.overallStatValue, { color: colors.primary }]}>
                  {dailyProgress.filter(p => p.completed).length}
                </Text>
                <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>Total complétés</Text>
              </View>
              
              <View style={[styles.overallStatCard, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.overallStatValue, { color: colors.primary }]}>
                  {Math.max(...goals.map(g => getGoalStats(g.id).longestStreak), 0)}
                </Text>
                <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>Meilleure série</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.accent }]}>
        <Text style={[styles.goalsTitle, { color: colors.text }]}>
          🎯 Objectifs{'\n'}Quotidiens
        </Text>
  
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.card }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeIcon}>{theme === 'light' ? '🌙' : '🌞'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pomodoroButton, { backgroundColor: colors.secondary }]}
            onPress={() => router.push('/(tabs)/pomodoro')}
          >
            <Text style={styles.pomodoroIcon}>⏰</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statsButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowStatsModal(true)}
          >
            <Text style={styles.statsIcon}>%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.secondary }]}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() - 1);
            setSelectedDate(newDate);
          }}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setSelectedDate(new Date())}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>
            {selectedDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() + 1);
            setSelectedDate(newDate);
          }}
        >
          <IconSymbol name="chevron.right" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.progressOverview, { backgroundColor: colors.card }]}>
        <View style={[styles.progressCircle, { backgroundColor: colors.primary }]}>
          <Text style={styles.progressPercentage}>{getTodayCompletionRate()}%</Text>
          <Text style={styles.progressLabel}>Complétés</Text>
        </View>
        
        <View style={styles.progressDetails}>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {dailyProgress.filter(p => p.date === formatDate(selectedDate) && p.completed).length} sur {goals.length} objectifs
          </Text>
          <Text style={[styles.progressSubtext, { color: colors.textSecondary }]}>
            {formatDate(selectedDate) === formatDate(new Date()) ? 'aujourd\'hui' : 'ce jour-là'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Aucun objectif défini</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Commencez par ajouter vos objectifs quotidiens pour suivre vos progrès
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Ajouter un objectif</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map(renderGoalCard)
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.accent }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvel objectif</Text>
            <TouchableOpacity onPress={addGoal}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Titre de l'objectif</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.accent, color: colors.text, backgroundColor: colors.card }]}
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                placeholder="Ex: Faire du sport, Lire 30 minutes..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Catégorie (optionnel)</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.accent, color: colors.text, backgroundColor: colors.card }]}
                value={newGoalCategory}
                onChangeText={setNewGoalCategory}
                placeholder="Ex: Santé, Apprentissage, Travail..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {renderStatsModal()}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  pomodoroButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pomodoroIcon: {
    fontSize: 18,
  },
  statsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsIcon: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  dateButton: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  progressLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  progressDetails: {
    flex: 1,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  completedGoalTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  goalCategory: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deleteButton: {
    padding: 4,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  miniProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
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
  formLabel: {
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
  statsContent: {
    flex: 1,
    padding: 16,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartDay: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    height: 80,
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  chartPercentage: {
    fontSize: 10,
  },
  overallStats: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overallStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  overallStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overallStatCard: {
    flex: 1,
    minWidth: (width - 80) / 2,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  overallStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  goalsTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    flexShrink: 1,
  },
});
