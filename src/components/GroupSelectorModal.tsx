import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type GroupInfo = {
  name: string;
  color?: string;
};

type Props = {
  visible: boolean;
  groups: GroupInfo[];
  onClose: () => void;
  onSelectGroup: (groupName: string, isNewGroup: boolean) => void;
};

export function GroupSelectorModal({
  visible,
  groups,
  onClose,
  onSelectGroup,
}: Props) {
  const [newName, setNewName] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);

  // デバッグ: グループ数をログに出力
  useEffect(() => {
    if (visible) {
      console.log(`[GroupSelectorModal] Showing ${groups.length} groups:`, groups.map(g => g.name));
    }
  }, [visible, groups]);

  const handleConfirm = () => {
    const trimmedNew = newName.trim();
    
    if (trimmedNew) {
      // 新規グループ名が入力された場合 → 新規作成
      console.log(`[GroupSelectorModal] Creating new group: "${trimmedNew}"`);
      onSelectGroup(trimmedNew, true);
    } else if (selectedName) {
      // 既存グループを選択した場合 → 追記
      console.log(`[GroupSelectorModal] Appending to existing group: "${selectedName}"`);
      onSelectGroup(selectedName, false);
    } else {
      // どちらも選択されていない場合 → グループなしで新規作成
      console.log(`[GroupSelectorModal] Creating memo without group`);
      onSelectGroup('', true);
    }
    
    setNewName('');
    setSelectedName(null);
  };

  const handleGroupSelect = (name: string) => {
    // 同じグループをタップしたら選択解除、違うグループなら選択
    if (selectedName === name) {
      setSelectedName(null);
    } else {
      setSelectedName(name);
    }
  };

  const renderGroupItem = ({ item, index }: { item: GroupInfo; index: number }) => {
    const isSelected = selectedName === item.name;
    const groupColor = item.color || '#9ca3af';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.groupRow,
          isSelected && styles.groupRowSelected,
          pressed && styles.groupRowPressed,
        ]}
        onPress={() => handleGroupSelect(item.name)}
      >
        <View style={[styles.colorStripe, { backgroundColor: groupColor }]} />
        <View style={styles.groupContent}>
          <Text style={[styles.groupLabel, { color: groupColor }]}>
            {item.name}
          </Text>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  // グループリストの高さを計算（グループ数に応じて、最大で画面の40%）
  const itemHeight = 56; // 各グループアイテムの高さ
  const calculatedHeight = Math.min(groups.length * itemHeight + 16, SCREEN_HEIGHT * 0.4);
  const listHeight = Math.max(calculatedHeight, 80);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View style={styles.sheet}>
            <Text style={styles.title}>グループを選択してください</Text>
            <Text style={styles.subtitle}>
              タップして選択（{groups.length}件のグループ）
            </Text>

            {groups.length > 0 ? (
              <View style={[styles.groupListContainer, { height: listHeight }]}>
                <FlatList
                  data={groups}
                  keyExtractor={(item, index) => `group-${item.name}-${index}`}
                  renderItem={renderGroupItem}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.groupListContent}
                  extraData={selectedName}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>保存されているグループはありません</Text>
              </View>
            )}

            <View style={styles.newGroupSection}>
              <Text style={styles.label}>新しいグループを作成</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="グループ名（空欄も可）"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
              />
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.cancelButton,
                  pressed && styles.actionPressed,
                ]}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.primaryButton,
                  pressed && styles.actionPressed,
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.primaryText}>保存</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: '85%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    color: '#6b7280',
  },
  groupListContainer: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  groupListContent: {
    padding: 8,
    paddingBottom: 8,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  groupRow: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 0,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  groupRowPressed: {
    backgroundColor: '#f9fafb',
  },
  groupRowSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  colorStripe: {
    width: 6,
    marginRight: 12,
  },
  groupContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  newGroupSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  cancelText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  primaryText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  actionPressed: {
    opacity: 0.7,
  },
});

