import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { useAuth } from '@/src/hooks/useAuth';
import { db } from '@/src/services/firebase';
import { AdBanner } from '@/src/components/AdBanner';

type MemoDoc = {
  text: string;
  groupName: string;
  userId: string;
  color?: string;
};

export default function DetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.uid;

  const isNew = id === 'new';

  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [groupName, setGroupName] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    if (isNew) {
      setLoading(false);
      return;
    }
    const fetch = async () => {
      try {
        const ref = doc(db, 'memos', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          Alert.alert('エラー', 'メモが見つかりませんでした。', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }
        const data = snap.data() as Partial<MemoDoc>;
        if (data.userId !== userId) {
          Alert.alert('エラー', 'このメモを見る権限がありません。', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }
        setText(data.text ?? '');
        setGroupName(data.groupName ?? '');
        setColor(data.color);
      } catch (e) {
        console.error('Failed to load memo', e);
        Alert.alert('エラー', 'メモの読み込みに失敗しました。', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, isNew, userId, router]);

  const canSave = useMemo(() => text.trim().length > 0, [text]);

  const handleSave = useCallback(async () => {
    if (!userId || !canSave) return;
    try {
      if (isNew || !id) {
        const memosRef = collection(db, 'memos');
        await addDoc(memosRef, {
          text: text.trim(),
          groupName: groupName.trim(),
          userId,
          createdAt: serverTimestamp(),
          color: color ?? '#9ca3af',
        });
        console.log(`[DetailScreen] Created new memo with group: "${groupName.trim()}"`);
      } else {
        const ref = doc(db, 'memos', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          console.error(`[DetailScreen] Memo ${id} does not exist`);
          return;
        }
        const data = snap.data() as Partial<MemoDoc>;
        if (data.userId !== userId) {
          console.error(`[DetailScreen] User ${userId} does not have permission to edit memo ${id}`);
          return;
        }

        const oldGroupName = data.groupName || '';
        const newGroupName = groupName.trim();
        
        console.log(`[DetailScreen] Updating memo ${id}:`);
        console.log(`  Old group: "${oldGroupName}"`);
        console.log(`  New group: "${newGroupName}"`);
        console.log(`  Old text: "${data.text}"`);
        console.log(`  New text: "${text.trim()}"`);

        await updateDoc(ref, {
          text: text.trim(),
          groupName: newGroupName,
          color: color ?? '#9ca3af',
        });
        
        console.log(`[DetailScreen] Successfully updated memo ${id}`);
      }
      router.back();
    } catch (e) {
      console.error('[DetailScreen] Failed to update memo', e);
      Alert.alert('エラー', 'メモの保存に失敗しました。');
    }
  }, [userId, canSave, isNew, id, text, groupName, color, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
          style={{ paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Text style={styles.headerButtonText}>戻る</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
          style={{ opacity: canSave ? 1 : 0.4, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Text style={styles.headerButtonText}>保存</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave, canSave, router]);

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingWrapper}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.textInput}
            placeholder="メモ本文"
            placeholderTextColor="#9ca3af"
            multiline
            value={text}
            onChangeText={setText}
          />
          <View style={styles.groupSection}>
            <Text style={styles.groupLabel}>グループ</Text>
            <TextInput
              style={styles.groupInput}
              placeholder="グループ名（空欄でも可）"
              placeholderTextColor="#9ca3af"
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>
          <View style={styles.colorRow}>
            <Text style={styles.colorLabel}>グループの色</Text>
            <View style={styles.colorOptions}>
              {['#9ca3af', '#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ef4444'].map(
                (c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      (color ?? '#9ca3af') === c && styles.colorDotActive,
                    ]}
                    onPress={() => setColor(c)}
                  />
                )
              )}
            </View>
          </View>
        </ScrollView>
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
  bottomSafeArea: {
    backgroundColor: '#f3f4f6',
  },
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 80,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  textInput: {
    height: 220,
    maxHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
  },
  groupSection: {
    marginTop: 12,
  },
  groupLabel: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  groupInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  colorRow: {
    marginTop: 12,
  },
  colorLabel: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  colorOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: '#111827',
  },
  clearColorButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  clearColorText: {
    fontSize: 12,
    color: '#374151',
  },
  headerButtonText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
});

