import React, { useMemo, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/src/hooks/useAuth';
import { useMemos } from '@/src/hooks/useMemos';
import { GroupSelectorModal } from '@/src/components/GroupSelectorModal';
import { AdBanner } from '@/src/components/AdBanner';

export default function InputScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid;
  const { memos, groupNames, groupColors, saveMemo, saving } = useMemos({ userId });

  // グループ情報を色付きで準備
  const groupsWithColors = React.useMemo(() => {
    return groupNames.map((name) => ({
      name,
      color: groupColors.get(name),
    }));
  }, [groupNames, groupColors]);

  const [text, setText] = useState('');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isSaveDisabled = useMemo(
    () => !userId || text.trim().length === 0 || saving,
    [userId, text, saving]
  );

  const handleOpenSelector = () => {
    if (isSaveDisabled) return;
    setSelectorVisible(true);
  };

  const handleSelectGroup = async (groupName: string, isNewGroup: boolean) => {
    try {
      await saveMemo(text, groupName, isNewGroup);
      setText('');
      setSelectorVisible(false);
      router.push('/list');
    } catch (e) {
      console.error('Failed to save memo', e);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.safeArea}>
      {/* 上部セーフエリア */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />
      
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 + insets.bottom : 0}
      >
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.listButton}
              onPress={() => router.push('/list')}
            >
              <Text style={styles.listButtonText}>
                メモリスト
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[
            styles.inputBlock,
            keyboardVisible && styles.inputBlockSmall,
          ]}>
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
      
      {/* 広告バナー */}
      <AdBanner />
      
      {/* 下部セーフエリア */}
      <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  topSafeArea: {
    backgroundColor: '#f3f4f6',
  },
  bottomSafeArea: {
    backgroundColor: '#f3f4f6',
  },
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  listButton: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  listButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  inputBlock: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flex: 1,
    width: '100%',
    marginBottom: 24,
    maxHeight: 350,
  },
  inputBlockSmall: {
    maxHeight: 220,
    flex: 0,
    height: 220,
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

