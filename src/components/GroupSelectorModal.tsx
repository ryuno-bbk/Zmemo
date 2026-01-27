import React, { useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

type GroupInfo = {
  name: string;
  color?: string;
};

type Props = {
  visible: boolean;
  groups: GroupInfo[];
  onClose: () => void;
  onSelectGroup: (groupName: string) => void;
};

export function GroupSelectorModal({
  visible,
  groups,
  onClose,
  onSelectGroup,
}: Props) {
  const [newName, setNewName] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  const handleConfirm = () => {
    const trimmedNew = newName.trim();
    // 新規入力があればそれを優先、なければ選択中の名前、どちらもなければ「グループなし」
    const nameToUse = trimmedNew || selectedName || '';
    onSelectGroup(nameToUse);
    setNewName('');
    setSelectedName(null);
    // すべてのスワイプを閉じる
    swipeableRefs.current.forEach((ref) => ref?.close());
  };

  const handleGroupSelect = (name: string) => {
    setSelectedName(name);
    // 他のスワイプを閉じる
    swipeableRefs.current.forEach((ref, key) => {
      if (key !== name) ref?.close();
    });
  };

  const renderRightActions = (group: GroupInfo) => (
    <TouchableOpacity
      style={[
        styles.swipeAction,
        { backgroundColor: group.color || '#9ca3af' },
      ]}
      onPress={() => handleGroupSelect(group.name)}
    >
      <Text style={styles.swipeActionText}>選択</Text>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }: { item: GroupInfo }) => {
    const isSelected = selectedName === item.name;
    const groupColor = item.color || '#9ca3af';

    const content = (
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

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(item.name, ref);
          } else {
            swipeableRefs.current.delete(item.name);
          }
        }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        onSwipeableWillOpen={() => handleGroupSelect(item.name)}
      >
        {content}
      </Swipeable>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>グループを選択してください</Text>

          <View style={styles.groupListContainer}>
            <FlatList
              data={groups}
              keyExtractor={(item) => item.name}
              renderItem={renderGroupItem}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.groupListContent}
            />
          </View>

          <View style={styles.newGroupSection}>
            <Text style={styles.label}>新しいグループを作成</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="グループ名（空欄も可）"
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#111827',
  },
  groupListContainer: {
    maxHeight: 280,
    marginBottom: 16,
  },
  groupListContent: {
    paddingBottom: 4,
  },
  groupRow: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 0,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  groupRowPressed: {
    backgroundColor: '#f3f4f6',
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
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  swipeActionText: {
    color: '#ffffff',
    fontSize: 15,
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

