/**
 * Automation Screen — Create and manage workflows
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAutomationStore, Automation, AutomationAction } from '../../store/automationStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GlowText } from '../../components/ui/GlowText';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

// Preset action templates
const ACTION_TEMPLATES: { label: string; action: AutomationAction }[] = [
  { label: '📱 Open WhatsApp', action: { type: 'OPEN_APP', app: 'whatsapp' } },
  { label: '🎵 Open Spotify', action: { type: 'OPEN_APP', app: 'spotify' } },
  { label: '▶️ Open YouTube', action: { type: 'OPEN_APP', app: 'youtube' } },
  { label: '🔍 Google Search', action: { type: 'SEARCH', query: '' } },
  { label: '🔔 Send Notification', action: { type: 'NOTIFY', message: '' } },
];

export default function AutomationScreen() {
  const { automations, isLoading, load, create, remove, toggle, run } = useAutomationStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [selectedActions, setSelectedActions] = useState<AutomationAction[]>([]);

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newTrigger.trim() || selectedActions.length === 0) {
      Alert.alert('Error', 'Please fill in name, trigger phrase, and add at least one action');
      return;
    }

    try {
      await create({
        name: newName.trim(),
        trigger: newTrigger.trim(),
        actions: selectedActions,
      });
      setShowCreate(false);
      setNewName('');
      setNewTrigger('');
      setSelectedActions([]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Automation',
      `Delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
      ]
    );
  };

  const renderAutomation = ({ item }: { item: Automation }) => (
    <GlassCard style={styles.automationCard}>
      <View style={styles.automationHeader}>
        <View style={styles.automationInfo}>
          <Text style={styles.automationName}>{item.name}</Text>
          <View style={styles.triggerBadge}>
            <Ionicons name="mic" size={10} color={Colors.primary} />
            <Text style={styles.triggerText}>"{item.trigger}"</Text>
          </View>
        </View>
        <Switch
          value={item.is_active}
          onValueChange={() => toggle(item.id)}
          trackColor={{ false: Colors.bgInput, true: 'rgba(0,212,255,0.3)' }}
          thumbColor={item.is_active ? Colors.primary : Colors.textMuted}
        />
      </View>

      {/* Actions list */}
      <View style={styles.actionsList}>
        {item.actions.map((action, i) => (
          <View key={i} style={styles.actionChip}>
            <Text style={styles.actionChipText}>
              {getActionLabel(action)}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.automationFooter}>
        <Text style={styles.runCount}>
          Ran {item.run_count} times
          {item.last_run ? ` · Last: ${new Date(item.last_run).toLocaleDateString()}` : ''}
        </Text>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.runBtn}
            onPress={() => run(item.id)}
            disabled={!item.is_active}
          >
            <Ionicons name="play" size={14} color={item.is_active ? Colors.success : Colors.textMuted} />
            <Text style={[styles.runBtnText, !item.is_active && { color: Colors.textMuted }]}>
              Run
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <LinearGradient colors={Colors.gradientBg} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <GlowText style={styles.title}>Automations</GlowText>
            <Text style={styles.subtitle}>Voice-triggered workflows</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreate(true)}
            accessibilityLabel="Create automation"
          >
            <Ionicons name="add" size={24} color={Colors.bg} />
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={automations}
          renderItem={renderAutomation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⚡</Text>
              <Text style={styles.emptyTitle}>No automations yet</Text>
              <Text style={styles.emptyText}>
                Create workflows triggered by voice commands.{'\n'}
                Example: "start study mode" → open Spotify + block apps
              </Text>
              <NeonButton
                title="Create First Automation"
                onPress={() => setShowCreate(true)}
                style={{ marginTop: Spacing.lg }}
              />
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Create Modal */}
        <Modal visible={showCreate} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Automation</Text>
                <TouchableOpacity onPress={() => setShowCreate(false)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="e.g. Study Mode"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Trigger Phrase</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={newTrigger}
                    onChangeText={setNewTrigger}
                    placeholder='e.g. "start study mode"'
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                  />
                  <Text style={styles.fieldHint}>
                    Say this phrase to trigger the automation
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Actions</Text>
                  {ACTION_TEMPLATES.map((template) => (
                    <TouchableOpacity
                      key={template.label}
                      style={[
                        styles.templateBtn,
                        selectedActions.some(a => a.type === template.action.type && a.app === template.action.app)
                          && styles.templateBtnActive,
                      ]}
                      onPress={() => {
                        const exists = selectedActions.some(
                          a => a.type === template.action.type && a.app === template.action.app
                        );
                        if (exists) {
                          setSelectedActions(prev =>
                            prev.filter(a => !(a.type === template.action.type && a.app === template.action.app))
                          );
                        } else {
                          setSelectedActions(prev => [...prev, template.action]);
                        }
                      }}
                    >
                      <Text style={styles.templateText}>{template.label}</Text>
                      {selectedActions.some(a => a.type === template.action.type && a.app === template.action.app) && (
                        <Ionicons name="checkmark" size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedActions.length > 0 && (
                  <View style={styles.selectedActions}>
                    <Text style={styles.fieldLabel}>Selected ({selectedActions.length})</Text>
                    {selectedActions.map((a, i) => (
                      <Text key={i} style={styles.selectedAction}>
                        {i + 1}. {getActionLabel(a)}
                      </Text>
                    ))}
                  </View>
                )}

                <NeonButton
                  title="Create Automation"
                  onPress={handleCreate}
                  style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getActionLabel(action: AutomationAction): string {
  switch (action.type) {
    case 'OPEN_APP': return `Open ${action.app}`;
    case 'SEARCH': return `Search: ${action.query || '...'}`;
    case 'NOTIFY': return `Notify: ${action.message || '...'}`;
    case 'SEND_MESSAGE': return `Message via ${action.app}`;
    default: return action.type;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { padding: Spacing.lg, paddingBottom: 100 },
  automationCard: { marginBottom: Spacing.md, padding: Spacing.md },
  automationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  automationInfo: { flex: 1, marginRight: Spacing.sm },
  automationName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  triggerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  triggerText: { fontSize: Typography.xs, color: Colors.primary, fontStyle: 'italic' },
  actionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  actionChip: {
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
  },
  actionChipText: { fontSize: Typography.xs, color: Colors.textSecondary },
  automationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  runCount: { fontSize: Typography.xs, color: Colors.textMuted },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  runBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  runBtnText: { fontSize: Typography.xs, color: Colors.success },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#0d0d2b',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  field: { marginBottom: Spacing.lg },
  fieldLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, letterSpacing: 1 },
  fieldInput: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  fieldHint: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
  templateBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.bgInput,
  },
  templateBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  templateText: { fontSize: Typography.sm, color: Colors.textPrimary },
  selectedActions: {
    backgroundColor: 'rgba(0,212,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectedAction: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
});
