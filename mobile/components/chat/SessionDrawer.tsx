/**
 * SessionDrawer — Slide-in panel showing chat history
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore, ChatSession } from '../../store/chatStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface SessionDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function SessionDrawer({ visible, onClose }: SessionDrawerProps) {
  const { sessions, currentSessionId, loadSessions, loadSession, deleteSession, createSession } = useChatStore();

  useEffect(() => {
    if (visible) loadSessions();
  }, [visible]);

  const handleSelect = async (id: string) => {
    await loadSession(id);
    onClose();
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Chat', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSession(id) },
    ]);
  };

  const handleNew = async () => {
    await createSession();
    onClose();
  };

  const renderSession = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={[styles.session, item.id === currentSessionId && styles.sessionActive]}
      onPress={() => handleSelect(item.id)}
    >
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.sessionMeta}>
          {item.message_count} messages · {new Date(item.updated_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item.id, item.title)}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.drawer}>
          <View style={styles.header}>
            <Text style={styles.title}>Chat History</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newBtn} onPress={handleNew}>
            <Ionicons name="add" size={18} color={Colors.primary} />
            <Text style={styles.newBtnText}>New Chat</Text>
          </TouchableOpacity>

          <FlatList
            data={sessions}
            renderItem={renderSession}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>No chat history yet</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {
    width: '75%',
    backgroundColor: '#0a0a20',
    borderLeftWidth: 1,
    borderLeftColor: Colors.bgCardBorder,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgCard,
  },
  newBtnText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.medium },
  list: { paddingHorizontal: Spacing.md },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  sessionActive: {
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
  },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium },
  sessionMeta: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: Spacing.xs },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, fontSize: Typography.sm },
});
