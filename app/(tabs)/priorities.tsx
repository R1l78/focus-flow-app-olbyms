
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
import { Task } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { saveTasks, loadTasks, generateId } from '@/utils/storage';

const { width } = Dimensions.get('window');
const QUADRANT_WIDTH = (width - 48) / 2;

const QUADRANTS = [
  { key: 'urgent-important', title: 'Urgent & Important', emoji: '🔥', color: '#FFCDD2' },
  { key: 'important-not-urgent', title: 'Important', emoji: '📋', color: '#C8E6C9' },
  { key: 'urgent-not-important', title: 'Urgent', emoji: '⚡', color: '#FFE0B2' },
  { key: 'neither', title: 'Ni urgent ni important', emoji: '💤', color: '#E1BEE7' },
] as const;

export default function PrioritiesScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllTasksModal, setShowAllTasksModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<Task['quadrant']>('urgent-important');

  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  const loadTasksFromStorage = async () => {
    const loadedTasks = await loadTasks();
    setTasks(loadedTasks);
    console.log('Tasks loaded in priorities:', loadedTasks.length);
  };

  const saveTasksToStorage = async (newTasks: Task[]) => {
    await saveTasks(newTasks);
    setTasks(newTasks);
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

    const updatedTasks = [...tasks, newTask];
    await saveTasksToStorage(updatedTasks);
    
    setNewTaskTitle('');
    setShowAddModal(false);
    console.log('Task added:', newTask);
  };

  const completeTask = async (taskId: string) => {
    console.log('Complete task called for:', taskId);
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    await saveTasksToStorage(updatedTasks);
    console.log('Task completed and removed');
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
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            await saveTasksToStorage(updatedTasks);
            console.log('Task deleted successfully');
          },
        },
      ]
    );
  };

  const moveTask = async (taskId: string, newQuadrant: Task['quadrant']) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, quadrant: newQuadrant } : task
    );
    await saveTasksToStorage(updatedTasks);
    console.log('Task moved to:', newQuadrant);
  };

  const getTasksForQuadrant = (quadrant: Task['quadrant']): Task[] => {
    return tasks.filter(task => task.quadrant === quadrant && !task.completed);
  };

  const getTotalTaskCount = (): number => {
    return tasks.filter(task => !task.completed).length;
  };

  const renderTask = (task: Task, quadrant: typeof QUADRANTS[0]) => (
    <View key={task.id} style={[styles.taskItem, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={styles.taskCheckbox}
        onPress={() => completeTask(task.id)}
      >
        <View style={[styles.checkbox, { borderColor: colors.primary }]}>
          <IconSymbol name="checkmark" size={12} color={colors.primary} />
        </View>
      </TouchableOpacity>
      
      <Text style={[styles.taskText, { color: colors.text }]} numberOfLines={2}>
        {task.title}
      </Text>
      
      <TouchableOpacity
        style={styles.taskDeleteButton}
        onPress={() => deleteTask(task.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol name="trash" size={12} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderQuadrant = (quadrant: typeof QUADRANTS[0]) => {
    const quadrantTasks = getTasksForQuadrant(quadrant.key);
    
    return (
      <View
        key={quadrant.key}
        style={[
          styles.quadrant,
          { 
            backgroundColor: quadrant.color,
            width: QUADRANT_WIDTH,
          }
        ]}
      >
        <View style={styles.quadrantHeader}>
          <Text style={styles.quadrantEmoji}>{quadrant.emoji}</Text>
          <Text style={[styles.quadrantTitle, { color: colors.text }]} numberOfLines={2}>
            {quadrant.title}
          </Text>
          <View style={[styles.taskCount, { backgroundColor: colors.primary }]}>
            <Text style={styles.taskCountText}>{quadrantTasks.length}</Text>
          </View>
        </View>
        
        <ScrollView style={styles.quadrantContent} showsVerticalScrollIndicator={false}>
          {quadrantTasks.length === 0 ? (
            <Text style={[styles.emptyQuadrant, { color: colors.textSecondary }]}>
              Aucune tâche
            </Text>
          ) : (
            quadrantTasks.map(task => renderTask(task, quadrant))
          )}
        </ScrollView>
        
        <TouchableOpacity
          style={[styles.addTaskButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setSelectedQuadrant(quadrant.key);
            setShowAddModal(true);
          }}
        >
          <IconSymbol name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAllTasksList = () => (
    <Modal
      visible={showAllTasksModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.accent }]}>
          <TouchableOpacity onPress={() => setShowAllTasksModal(false)}>
            <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>Fermer</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Toutes les tâches</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <ScrollView style={styles.allTasksContent}>
          {QUADRANTS.map(quadrant => {
            const quadrantTasks = getTasksForQuadrant(quadrant.key);
            if (quadrantTasks.length === 0) return null;
            
            return (
              <View key={quadrant.key} style={styles.allTasksSection}>
                <View style={styles.allTasksSectionHeader}>
                  <Text style={styles.allTasksEmoji}>{quadrant.emoji}</Text>
                  <Text style={[styles.allTasksSectionTitle, { color: colors.text }]}>
                    {quadrant.title}
                  </Text>
                  <View style={[styles.allTasksCount, { backgroundColor: colors.primary }]}>
                    <Text style={styles.allTasksCountText}>{quadrantTasks.length}</Text>
                  </View>
                </View>
                
                {quadrantTasks.map(task => (
                  <View key={task.id} style={[styles.allTaskItem, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                      style={styles.taskCheckbox}
                      onPress={() => completeTask(task.id)}
                    >
                      <View style={[styles.checkbox, { borderColor: colors.primary }]}>
                        <IconSymbol name="checkmark" size={12} color={colors.primary} />
                      </View>
                    </TouchableOpacity>
                    
                    <Text style={[styles.allTaskText, { color: colors.text }]}>
                      {task.title}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.taskDeleteButton}
                      onPress={() => deleteTask(task.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol name="trash" size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.accent }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🧠 Matrice d'Eisenhower</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.card }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeIcon}>{theme === 'light' ? '🌙' : '🌞'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.allTasksButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAllTasksModal(true)}
          >
            <IconSymbol name="list.bullet" size={20} color="white" />
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.badgeText}>{getTotalTaskCount()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.matrix}>
          {QUADRANTS.map(renderQuadrant)}
        </View>
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvelle tâche</Text>
            <TouchableOpacity onPress={addTask}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Titre de la tâche</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.accent, color: colors.text, backgroundColor: colors.card }]}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Ex: Préparer la présentation..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Quadrant</Text>
              <View style={styles.quadrantSelector}>
                {QUADRANTS.map(quadrant => (
                  <TouchableOpacity
                    key={quadrant.key}
                    style={[
                      styles.quadrantOption,
                      { backgroundColor: quadrant.color },
                      selectedQuadrant === quadrant.key && { borderColor: colors.primary, borderWidth: 3 }
                    ]}
                    onPress={() => setSelectedQuadrant(quadrant.key)}
                  >
                    <Text style={styles.quadrantOptionEmoji}>{quadrant.emoji}</Text>
                    <Text style={[styles.quadrantOptionText, { color: colors.text }]} numberOfLines={2}>
                      {quadrant.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {renderAllTasksList()}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
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
  allTasksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  matrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quadrant: {
    borderRadius: 12,
    padding: 12,
    minHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quadrantEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  quadrantTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  taskCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  quadrantContent: {
    flex: 1,
    marginBottom: 8,
  },
  emptyQuadrant: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskCheckbox: {
    marginRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  taskDeleteButton: {
    padding: 4,
  },
  addTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quadrantSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quadrantOption: {
    width: (width - 80) / 2,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quadrantOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quadrantOptionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  allTasksContent: {
    flex: 1,
    padding: 16,
  },
  allTasksSection: {
    marginBottom: 24,
  },
  allTasksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  allTasksEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  allTasksSectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  allTasksCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  allTasksCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  allTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  allTaskText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
