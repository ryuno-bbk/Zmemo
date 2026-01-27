import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/src/hooks/useAuth';
import { useMemos } from '@/src/hooks/useMemos';
import { GroupSelectorModal } from '@/src/components/GroupSelectorModal';

export default function InputScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid;
  const { memos, groupNames, groupColors, saveMemo } = useMemos({ userId });

  // グループ情報を色付きで準備
  const groupsWithColors = React.useMemo(() => {
    return groupNames.map((name) => ({
      name,
      color: groupColors.get(name),
    }));
  }, [groupNames, groupColors]);

  const [text, setText] = useState('');
  const [selectorVisible, setSelectorVisible] = useState(false);

  const isSaveDisabled = useMemo(
    () => !userId || text.trim().length === 0,
    [userId, text]
  );

  const handleOpenSelector = () => {
    if (isSaveDisabled) return;
    setSelectorVisible(true);
  };

  const handleSelectGroup = async (groupName: string) => {
    try {
      await saveMemo(text, groupName);
      setText('');
      setSelectorVisible(false);
      router.push('/list');
    } catch (e) {
      console.error('Failed to save memo', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.listButton}
              onPress={() => router.push('/list')}
            >
              <Text style={styles.listButtonText}>
                メモリスト{memos.length > 0 ? ` (${memos.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputBlock}>
            <TextInput
              style={styles.input}
              placeholder="メモを入力してください…"
              placeholderTextColor="#9ca3af"
              multiline
              value={text}
              onChangeText={setText}
            />
          </View>

          <TouchableOpacity
            onPress={handleOpenSelector}
            disabled={isSaveDisabled}
            style={[
              styles.saveButton,
              isSaveDisabled && styles.saveButtonDisabled,
            ]}
          >
            <Text style={styles.saveIcon}>✓</Text>
          </TouchableOpacity>
        </View>

        <GroupSelectorModal
          visible={selectorVisible}
          groups={groupsWithColors}
          onClose={() => setSelectorVisible(false)}
          onSelectGroup={handleSelectGroup}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  headerRow: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  listButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  listButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  inputBlock: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 280,
    marginBottom: 20,
    flex: 1,
    maxHeight: '70%',
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
    textAlignVertical: 'top',
  },
  saveButton: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    marginTop: 'auto',
    marginBottom: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveIcon: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '800',
  },
});

