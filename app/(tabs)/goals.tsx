
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
import { colors, commonStyles } from '@/styles/commonStyles';
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

const { width } = Dimensions.get('window');

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyGoalProgress[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadData();
    
    // Ensure notifications are set up when goals screen loads
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
    console.log('Goals saved:', newGoals.length);
  };

  const saveProgressToStorage = async (newProgress: DailyGoalProgress[]) => {
    await saveDailyProgress(newProgress);
    setDailyProgress(newProgress);
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
      // Toggle existing progress
      updatedProgress = dailyProgress.map(p =>
        p.goalId === goalId && p.date === dateStr
          ? { ...p, completed: !p.completed }
          : p
      );
    } else {
      // Create new progress entry
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
    
    // Calculate current streak
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
    
    // Calculate longest streak
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
      <View style={styles.chartContainer}>
        <Text style={commonStyles.subtitle}>Progression des 7 derniers jours</Text>
        
        <View style={styles.chart}>
          {lastSevenDays.map((date, index) => {
            const rate = completionRates[index];
            const isToday = formatDate(date) === formatDate(new Date());
            
            return (
              <View key={index} style={styles.chartDay}>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${rate}%`,
                        backgroundColor: isToday ? colors.primary : colors.secondary,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, isToday && styles.todayLabel]}>
                  {date.getDate()}
                </Text>
                <Text style={styles.chartPercentage}>{rate}%</Text>
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
      <View key={goal.id} style={[styles.goalCard, isCompleted && styles.completedGoalCard]}>
        <View style={styles.goalHeader}>
          <TouchableOpacity
            style={styles.goalCheckbox}
            onPress={() => toggleGoalProgress(goal.id, selectedDate)}
          >
            <View style={[styles.checkbox, isCompleted && styles.checkedBox]}>
              {isCompleted && <IconSymbol name="checkmark" size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <View style={styles.goalInfo}>
            <Text style={[styles.goalTitle, isCompleted && styles.completedGoalTitle]}>
              {goal.title}
            </Text>
            {goal.category && (
              <Text style={styles.goalCategory}>{goal.category}</Text>
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
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Série actuelle</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Meilleure série</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>Taux de réussite</Text>
          </View>
        </View>
        
        {/* Mini progress bar */}
        <View style={styles.miniProgressBar}>
          <View
            style={[
              styles.miniProgressFill,
              { width: `${stats.completionRate}%` }
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
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowStatsModal(false)}>
            <Text style={styles.cancelButton}>Fermer</Text>
          </TouchableOpacity>
          <Text style={commonStyles.subtitle}>Statistiques détaillées</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <ScrollView style={styles.statsContent}>
          {renderProgressChart()}
          
          <View style={styles.overallStats}>
            <Text style={commonStyles.subtitle}>Résumé global</Text>
            
            <View style={styles.overallStatsGrid}>
              <View style={styles.overallStatCard}>
                <Text style={styles.overallStatValue}>{goals.length}</Text>
                <Text style={styles.overallStatLabel}>Objectifs actifs</Text>
              </View>
              
              <View style={styles.overallStatCard}>
                <Text style={styles.overallStatValue}>{getTodayCompletionRate()}%</Text>
                <Text style={styles.overallStatLabel}>Complétés aujourd'hui</Text>
              </View>
              
              <View style={styles.overallStatCard}>
                <Text style={styles.overallStatValue}>
                  {dailyProgress.filter(p => p.completed).length}
                </Text>
                <Text style={styles.overallStatLabel}>Total complétés</Text>
              </View>
              
              <View style={styles.overallStatCard}>
                <Text style={styles.overallStatValue}>
                  {Math.max(...goals.map(g => getGoalStats(g.id).longestStreak), 0)}
                </Text>
                <Text style={styles.overallStatLabel}>Meilleure série</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={commonStyles.title}>🎯 Objectifs quotidiens</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => setShowStatsModal(true)}
          >
            <IconSymbol name="chart.bar" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Navigation */}
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
          <Text style={styles.dateText}>
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

      {/* Progress Overview */}
      <View style={styles.progressOverview}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>{getTodayCompletionRate()}%</Text>
          <Text style={styles.progressLabel}>Complétés</Text>
        </View>
        
        <View style={styles.progressDetails}>
          <Text style={styles.progressText}>
            {dailyProgress.filter(p => p.date === formatDate(selectedDate) && p.completed).length} sur {goals.length} objectifs
          </Text>
          <Text style={styles.progressSubtext}>
            {formatDate(selectedDate) === formatDate(new Date()) ? 'aujourd\'hui' : 'ce jour-là'}
          </Text>
        </View>
      </View>

      {/* Goals List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={styles.emptyStateTitle}>Aucun objectif défini</Text>
            <Text style={styles.emptyStateText}>
              Commencez par ajouter vos objectifs quotidiens pour suivre vos progrès
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Ajouter un objectif</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map(renderGoalCard)
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={commonStyles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={commonStyles.subtitle}>Nouvel objectif</Text>
            <TouchableOpacity onPress={addGoal}>
              <Text style={styles.saveButton}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={commonStyles.text}>Titre de l'objectif</Text>
              <TextInput
                style={styles.textInput}
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                placeholder="Ex: Faire du sport, Lire 30 minutes..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={commonStyles.text}>Catégorie (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                value={newGoalCategory}
                onChangeText={setNewGoalCategory}
                placeholder="Ex: Santé, Apprentissage, Travail..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Stats Modal */}
      {renderStatsModal()}
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statsButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    width: 40,
    height: 40,
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
    color: colors.text,
    textTransform: 'capitalize',
  },
  progressOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    ...commonStyles.shadow,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
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
    color: colors.text,
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...commonStyles.shadow,
  },
  completedGoalCard: {
    backgroundColor: colors.highlight,
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
    borderColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: colors.primary,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  completedGoalTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  goalCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.accent,
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
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: colors.highlight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
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
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
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
    borderBottomColor: '#E0E0E0',
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
  statsContent: {
    flex: 1,
    padding: 16,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...commonStyles.shadow,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
  },
  chartDay: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    height: 80,
    backgroundColor: colors.highlight,
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
    color: colors.textSecondary,
    marginBottom: 2,
  },
  todayLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  chartPercentage: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  overallStats: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    ...commonStyles.shadow,
  },
  overallStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  overallStatCard: {
    flex: 1,
    minWidth: (width - 80) / 2,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  overallStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
