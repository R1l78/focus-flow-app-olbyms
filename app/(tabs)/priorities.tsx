
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
import { Task } from '@/types';
import { saveTasks, loadTasks, generateId } from '@/utils/storage';

const { width } = Dimensions.get('window');
const QUADRANT_WIDTH = (width - 48) / 2; // Account for padding and gap

const QUADRANTS = [
  {
    key: 'urgent-important' as const,
    title: 'Urgent & Important',
    subtitle: 'À faire immédiatement',
    color: colors.urgentImportant,
    icon: '🔥',
  },
  {
    key: 'important-not-urgent' as const,
    title: 'Important mais pas urgent',
    subtitle: 'À planifier',
    color: colors.importantNotUrgent,
    icon: '📋',
  },
  {
    key: 'urgent-not-important' as const,
    title: 'Urgent mais pas important',
    subtitle: 'À déléguer',
    color: colors.urgentNotImportant,
    icon: '⚡',
  },
  {
    key: 'neither' as const,
    title: 'Ni urgent ni important',
    subtitle: 'À éliminer',
    color: colors.neitherUrgentNorImportant,
    icon: '🗑️',
  },
];

export default function PrioritiesScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<Task['quadrant']>('urgent-important');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  const loadTasksFromStorage = async () => {
    const loadedTasks = await loadTasks();
    // Filter out completed tasks
    const activeTasks = loadedTasks.filter(task => !task.completed);
    setTasks(activeTasks);
    console.log('Tasks loaded in priorities:', activeTasks.length);
  };

  const saveTasksToStorage = async (newTasks: Task[]) => {
    await saveTasks(newTasks);
    // Only show active tasks in the UI
    const activeTasks = newTasks.filter(task => !task.completed);
    setTasks(activeTasks);
    console.log('Tasks saved in priorities:', newTasks.length);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour la tâche');
      return;
    }

    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      quadrant: selectedQuadrant,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Load all tasks (including completed ones) to save
    const allTasks = await loadTasks();
    const updatedTasks = [...allTasks, newTask];
    await saveTasksToStorage(updatedTasks);
    
    setNewTaskTitle('');
    setShowAddModal(false);
    console.log('Task added:', newTask);
  };

  const completeTask = async (taskId: string) => {
    console.log('Complete task called for:', taskId);
    // Load all tasks to update the completed one
    const allTasks = await loadTasks();
    const updatedTasks = allTasks.map(task =>
      task.id === taskId ? { ...task, completed: true } : task
    );
    
    await saveTasksToStorage(updatedTasks);
    console.log('Task completed:', taskId);
  };

  const deleteTask = async (taskId: string) => {
    console.log('Delete task called for:', taskId);
    Alert.alert(
      'Supprimer la tâche',
      'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting task:', taskId);
            const allTasks = await loadTasks();
            const updatedTasks = allTasks.filter(task => task.id !== taskId);
            await saveTasksToStorage(updatedTasks);
            console.log('Task deleted successfully');
          },
        },
      ]
    );
  };

  const moveTask = async (taskId: string, newQuadrant: Task['quadrant']) => {
    console.log('Move task called for:', taskId, 'to', newQuadrant);
    const allTasks = await loadTasks();
    const updatedTasks = allTasks.map(task =>
      task.id === taskId ? { ...task, quadrant: newQuadrant } : task
    );
    
    await saveTasksToStorage(updatedTasks);
    console.log('Task moved:', taskId, 'to', newQuadrant);
  };

  const getTasksForQuadrant = (quadrant: Task['quadrant']): Task[] => {
    return tasks.filter(task => task.quadrant === quadrant);
  };

  const getTotalTaskCount = (): number => {
    return tasks.length;
  };

  const renderTask = (task: Task, quadrant: typeof QUADRANTS[0]) => (
    <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.card }]}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => completeTask(task.id)}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <IconSymbol name="checkmark.circle" size={18} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionButton]}
            onPress={() => deleteTask(task.id)}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <IconSymbol name="trash" size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Move to other quadrants */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moveOptions}>
        {QUADRANTS.filter(q => q.key !== quadrant.key).map(otherQuadrant => (
          <TouchableOpacity
            key={otherQuadrant.key}
            style={[styles.moveButton, { backgroundColor: otherQuadrant.color }]}
            onPress={() => moveTask(task.id, otherQuadrant.key)}
          >
            <Text style={styles.moveButtonText}>{otherQuadrant.icon}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderQuadrant = (quadrant: typeof QUADRANTS[0]) => {
    const quadrantTasks = getTasksForQuadrant(quadrant.key);
    
    return (
      <View key={quadrant.key} style={[styles.quadrant, { backgroundColor: quadrant.color }]}>
        <View style={styles.quadrantHeader}>
          <Text style={styles.quadrantIcon}>{quadrant.icon}</Text>
          <View style={styles.quadrantTitleContainer}>
            <Text style={styles.quadrantTitle}>{quadrant.title}</Text>
            <Text style={styles.quadrantSubtitle}>{quadrant.subtitle}</Text>
          </View>
          <View style={styles.taskCount}>
            <Text style={styles.taskCountText}>{quadrantTasks.length}</Text>
          </View>
        </View>
        
        <ScrollView style={styles.quadrantTasks} showsVerticalScrollIndicator={false}>
          {quadrantTasks.length === 0 ? (
            <Text style={styles.noTasksText}>Aucune tâche</Text>
          ) : (
            quadrantTasks.map(task => renderTask(task, quadrant))
          )}
          
          {/* Add task button */}
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => {
              setSelectedQuadrant(quadrant.key);
              setShowAddModal(true);
            }}
          >
            <IconSymbol name="plus" size={20} color={colors.textSecondary} />
            <Text style={styles.addTaskText}>Ajouter une tâche</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderAllTasksList = () => (
    <Modal
      visible={showAllTasks}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAllTasks(false)}>
            <Text style={styles.cancelButton}>Fermer</Text>
          </TouchableOpacity>
          <Text style={commonStyles.subtitle}>Toutes les tâches</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <ScrollView style={styles.allTasksList}>
          {QUADRANTS.map(quadrant => {
            const quadrantTasks = getTasksForQuadrant(quadrant.key);
            if (quadrantTasks.length === 0) return null;
            
            return (
              <View key={quadrant.key} style={styles.taskSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>{quadrant.icon}</Text>
                  <Text style={styles.sectionTitle}>{quadrant.title}</Text>
                  <Text style={styles.sectionCount}>({quadrantTasks.length})</Text>
                </View>
                
                {quadrantTasks.map(task => (
                  <View key={task.id} style={[styles.listTaskCard, { borderLeftColor: quadrant.color }]}>
                    <Text style={styles.listTaskTitle}>{task.title}</Text>
                    <View style={styles.listTaskActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => completeTask(task.id)}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <IconSymbol name="checkmark.circle" size={20} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteActionButton]}
                        onPress={() => deleteTask(task.id)}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <IconSymbol name="trash" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
          
          {getTotalTaskCount() === 0 && (
            <Text style={[commonStyles.textSecondary, styles.noTasksOverall]}>
              Aucune tâche en cours
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={commonStyles.title}>🧠 Matrice d'Eisenhower</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.summaryButton}
            onPress={() => setShowAllTasks(true)}
          >
            <IconSymbol name="list.bullet" size={20} color="white" />
            <Text style={styles.summaryText}>({getTotalTaskCount()})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Matrix Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.matrixGrid}>
          <View style={styles.matrixRow}>
            {renderQuadrant(QUADRANTS[0])}
            {renderQuadrant(QUADRANTS[1])}
          </View>
          <View style={styles.matrixRow}>
            {renderQuadrant(QUADRANTS[2])}
            {renderQuadrant(QUADRANTS[3])}
          </View>
        </View>
      </ScrollView>

      {/* Add Task Modal */}
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
            <Text style={commonStyles.subtitle}>Nouvelle tâche</Text>
            <TouchableOpacity onPress={addTask}>
              <Text style={styles.saveButton}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Quadrant Selection */}
            <View style={styles.formGroup}>
              <Text style={commonStyles.text}>Quadrant</Text>
              <View style={styles.quadrantSelector}>
                {QUADRANTS.map(quadrant => (
                  <TouchableOpacity
                    key={quadrant.key}
                    style={[
                      styles.quadrantOption,
                      { backgroundColor: quadrant.color },
                      selectedQuadrant === quadrant.key && styles.selectedQuadrantOption
                    ]}
                    onPress={() => setSelectedQuadrant(quadrant.key)}
                  >
                    <Text style={styles.quadrantOptionIcon}>{quadrant.icon}</Text>
                    <Text style={styles.quadrantOptionTitle}>{quadrant.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Task Title */}
            <View style={styles.formGroup}>
              <Text style={commonStyles.text}>Titre de la tâche</Text>
              <TextInput
                style={styles.textInput}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Que devez-vous faire ?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* All Tasks List Modal */}
      {renderAllTasksList()}
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
    alignItems: 'center',
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  matrixGrid: {
    gap: 16,
  },
  matrixRow: {
    flexDirection: 'row',
    gap: 16,
  },
  quadrant: {
    width: QUADRANT_WIDTH,
    height: 300,
    borderRadius: 12,
    padding: 12,
    ...commonStyles.shadow,
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  quadrantIcon: {
    fontSize: 20,
  },
  quadrantTitleContainer: {
    flex: 1,
  },
  quadrantTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  quadrantSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  taskCount: {
    backgroundColor: colors.card,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  quadrantTasks: {
    flex: 1,
  },
  noTasksText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  taskCard: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    ...commonStyles.shadow,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  taskTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 16,
    marginRight: 8,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
  },
  deleteActionButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  moveOptions: {
    flexDirection: 'row',
  },
  moveButton: {
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  moveButtonText: {
    fontSize: 12,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addTaskText: {
    fontSize: 12,
    color: colors.textSecondary,
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
  quadrantSelector: {
    gap: 12,
    marginTop: 8,
  },
  quadrantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedQuadrantOption: {
    borderColor: colors.text,
  },
  quadrantOptionIcon: {
    fontSize: 20,
  },
  quadrantOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
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
    minHeight: 80,
  },
  allTasksList: {
    flex: 1,
    padding: 16,
  },
  taskSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listTaskCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    ...commonStyles.shadow,
  },
  listTaskTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  listTaskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noTasksOverall: {
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
});
