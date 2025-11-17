
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
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { MemoryItem } from '@/types';
import { saveMemoryItems, loadMemoryItems, generateId } from '@/utils/storage';
import { NotificationService } from '@/utils/notificationService';

export default function MemoryScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const items = await loadMemoryItems();
    setMemoryItems(items);
    console.log('Memory items loaded:', items.length);
  };

  const saveItemsToStorage = async (items: MemoryItem[]) => {
    await saveMemoryItems(items);
    setMemoryItems(items);
    
    // Update memory notifications
    await NotificationService.scheduleMemoryNotifications(items);
    console.log('Memory items saved:', items.length);
  };

  const addMemoryItem = async () => {
    if (!newItemTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre');
      return;
    }

    if (!newItemContent.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un contenu');
      return;
    }

    const newItem: MemoryItem = {
      id: generateId(),
      title: newItemTitle.trim(),
      content: newItemContent.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...memoryItems, newItem];
    await saveItemsToStorage(updatedItems);
    
    setNewItemTitle('');
    setNewItemContent('');
    setShowAddModal(false);
    console.log('Memory item added:', newItem);
  };

  const deleteMemoryItem = async (itemId: string) => {
    console.log('Delete memory item called for:', itemId);
    Alert.alert(
      'Supprimer l\'élément',
      'Êtes-vous sûr de vouloir supprimer cet élément ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting memory item:', itemId);
            const updatedItems = memoryItems.filter(item => item.id !== itemId);
            await saveItemsToStorage(updatedItems);
            console.log('Memory item deleted successfully');
          },
        },
      ]
    );
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const renderMemoryItem = (item: MemoryItem) => {
    const isExpanded = expandedItemId === item.id;
    const preview = item.content.length > 80 
      ? item.content.substring(0, 80) + '...' 
      : item.content;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.memoryCard, { backgroundColor: colors.card }]}
        onPress={() => toggleExpanded(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.memoryHeader}>
          <View style={styles.memoryIcon}>
            <Text style={styles.memoryIconText}>🧠</Text>
          </View>
          <View style={styles.memoryInfo}>
            <Text style={[styles.memoryTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.memoryDate, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteMemoryItem(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.memoryContent}>
          <Text style={[styles.memoryText, { color: colors.text }]}>
            {isExpanded ? item.content : preview}
          </Text>
        </View>

        {item.content.length > 80 && (
          <View style={styles.expandIndicator}>
            <IconSymbol 
              name={isExpanded ? "chevron.up" : "chevron.down"} 
              size={16} 
              color={colors.primary} 
            />
            <Text style={[styles.expandText, { color: colors.primary }]}>
              {isExpanded ? 'Réduire' : 'Voir plus'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.accent }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          🧠 Mémoire
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.card }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeIcon}>{theme === 'light' ? '🌙' : '🌞'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.highlight }]}>
        <Text style={[styles.infoBannerText, { color: colors.text }]}>
          💡 Tu recevras 2-3 rappels par jour pour réviser tes éléments
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {memoryItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🧠</Text>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              Aucun élément à mémoriser
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Ajoute des éléments que tu souhaites mémoriser.{'\n'}
              Tu recevras des rappels réguliers pour les réviser.
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Ajouter un élément</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <React.Fragment>
            {memoryItems.map(renderMemoryItem)}
          </React.Fragment>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.accent }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Nouvel élément
            </Text>
            <TouchableOpacity onPress={addMemoryItem}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>
                Ajouter
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                Titre
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    borderColor: colors.accent, 
                    color: colors.text, 
                    backgroundColor: colors.card 
                  }
                ]}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
                placeholder="Ex: Formule mathématique, Vocabulaire..."
                placeholderTextColor={colors.textSecondary}
                multiline={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                Contenu / Définition
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    borderColor: colors.accent, 
                    color: colors.text, 
                    backgroundColor: colors.card 
                  }
                ]}
                value={newItemContent}
                onChangeText={setNewItemContent}
                placeholder="Écris ici ce que tu veux mémoriser..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            <View style={[styles.tipBox, { backgroundColor: colors.highlight }]}>
              <Text style={[styles.tipText, { color: colors.text }]}>
                💡 <Text style={{ fontWeight: '600' }}>Astuce :</Text> Sois concis et clair. 
                Les rappels afficheront un extrait de ton contenu.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  infoBannerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  memoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memoryIconText: {
    fontSize: 20,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memoryDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  memoryContent: {
    marginBottom: 8,
  },
  memoryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 4,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '600',
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
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
  },
  tipBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
