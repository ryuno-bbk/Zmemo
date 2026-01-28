import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { deleteDoc, doc } from 'firebase/firestore';

import { useAuth } from '@/src/hooks/useAuth';
import { useMemos } from '@/src/hooks/useMemos';
import { db } from '@/src/services/firebase';

type GroupItem = {
  key: string;
  groupName: string;
  color?: string;
  texts: string[];
  ids: string[];
};

export default function ListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid;
  const { memos } = useMemos({ userId });
  const insets = useSafeAreaInsets();

  const keyFor = (groupName: string) => groupName || '__none__';

  const groups: GroupItem[] = useMemo(() => {
    const map = new Map<string, GroupItem>();
    // すべてのメモをループして、同じグループ名のメモをまとめる
    // 既存のメモも新しいメモもすべて保持される
    // メモのIDをSetで管理して、重複を防ぐ
    const processedIds = new Set<string>();
    
    // デバッグ: メモの総数をログに出力
    console.log(`[ListScreen] Processing ${memos.length} memos for grouping`);
    
    for (const m of memos) {
      // 重複チェック：同じIDのメモが既に処理されている場合はスキップ
      if (processedIds.has(m.id)) {
        console.warn(`[ListScreen] Duplicate memo ID detected: ${m.id}`);
        continue;
      }
      processedIds.add(m.id);
      
      const key = keyFor(m.groupName);
      const displayName = m.groupName || ''; // グループ名が空の場合は空文字列
      let g = map.get(key);
      if (!g) {
        g = { key, groupName: displayName, color: m.color, texts: [], ids: [] };
        map.set(key, g);
      }
      // 既存のメモを保持したまま、新しいメモを追加（改行で区切る）
      g.texts.push(m.text);
      g.ids.push(m.id);
      if (!g.color && m.color) g.color = m.color;
    }
    
    // デバッグ: グループ化後のグループ数をログに出力
    const groupsArray = Array.from(map.values());
    console.log(`[ListScreen] Created ${groupsArray.length} groups`);
    groupsArray.forEach((g) => {
      console.log(`[ListScreen] Group "${g.groupName}": ${g.texts.length} memos, IDs: ${g.ids.join(', ')}`);
    });
    
    return groupsArray;
  }, [memos]);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const selectedCount = selectedKeys.size;

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleRowPress = (group: GroupItem) => {
    if (selectMode) {
      toggleSelect(group.key);
    } else if (group.ids.length > 0) {
      // グループ内のメモをcreatedAtでソートして、最新のメモを開く
      const groupMemos = memos.filter((m) => group.ids.includes(m.id));
      const sortedGroupMemos = [...groupMemos].sort((a, b) => {
        // createdAtでソート（新しい順）
        // 注意: createdAtはFirestoreのTimestamp型なので、直接比較できない
        // しかし、useMemosで既にorderBy('createdAt', 'desc')でソートされているので、
        // memos配列の順序を保持する
        return 0;
      });
      // グループ内の最新メモ（memos配列で最初に見つかったもの）を開く
      const latestMemo = groupMemos[0] || memos.find((m) => group.ids.includes(m.id));
      if (latestMemo) {
        router.push(`/detail/${latestMemo.id}`);
      }
    }
  };

  const handleEnterSelectMode = () => {
    setSelectMode(true);
    setSelectedKeys(new Set());
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedKeys(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;
    Alert.alert(
      '削除確認',
      `${selectedCount} 件のグループを削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const targets = memos.filter((m) =>
                selectedKeys.has(keyFor(m.groupName))
              );
              await Promise.all(
                targets.map((m) => deleteDoc(doc(db, 'memos', m.id)))
              );
              handleCancelSelect();
            } catch (e) {
              console.error('Failed to delete memos', e);
            }
          },
        },
      ]
    );
  };

  const confirmDeleteGroup = (group: GroupItem) => {
    Alert.alert(
      '削除確認',
      `「${group.groupName}」グループ内のメモをすべて削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                group.ids.map((id) => deleteDoc(doc(db, 'memos', id)))
              );
            } catch (e) {
              console.error('Failed to delete group memos', e);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (group: GroupItem) => (
    <TouchableOpacity
      style={styles.swipeDelete}
      onPress={() => confirmDeleteGroup(group)}
    >
      <Text style={styles.swipeDeleteText}>削除</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safeArea}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          {selectMode ? (
            <TouchableOpacity 
              onPress={handleCancelSelect} 
              hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={[styles.navLink, styles.navBold]}>キャンセル</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => router.back()} 
              hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={[styles.navLink, styles.navBold]}>戻る</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.navTitle}>メモリスト</Text>
          {selectMode ? (
            <TouchableOpacity
              onPress={handleDeleteSelected}
              disabled={selectedCount === 0}
              hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, opacity: selectedCount === 0 ? 0.4 : 1 }}
            >
              <Text
                style={[
                  styles.navLink,
                  styles.deleteLink,
                  styles.navBold,
                ]}
              >
                削除{selectedCount > 0 ? `(${selectedCount})` : ''}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleEnterSelectMode}
              hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={[styles.navLink, styles.navBold]}>選択</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.container}>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.key}
          contentContainerStyle={
            groups.length === 0 ? styles.emptyList : undefined
          }
          renderItem={({ item }) => {
            const selected = selectedKeys.has(item.key);
            const content = (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleRowPress(item)}
              >
                <View
                  style={[
                    styles.colorStripe,
                    { backgroundColor: item.color ?? '#9ca3af' },
                  ]}
                />
                <View style={styles.cardContent}>
                  <Text 
                    style={styles.cardText}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.texts.join('\n\n')}
                  </Text>
                  {item.groupName ? (
                    <Text
                      style={[
                        styles.groupTag,
                        {
                          borderColor: item.color ?? '#9ca3af',
                          color: item.color ?? '#9ca3af',
                        },
                      ]}
                    >
                      {item.groupName}
                    </Text>
                  ) : null}
                </View>
                {selectMode && (
                  <View style={styles.checkContainer}>
                    <View
                      style={[
                        styles.checkCircle,
                        selected && styles.checkCircleSelected,
                      ]}
                    />
                  </View>
                )}
              </Pressable>
            );

            if (selectMode) {
              return content;
            }

            return (
              <Swipeable
                renderRightActions={() => renderRightActions(item)}
                overshootRight={false}
              >
                {content}
              </Swipeable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              まだメモがありません。メモを追加してください。
            </Text>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/detail/new')}
        >
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>
      </View>
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerSafeArea: {
    backgroundColor: '#ffffff',
  },
  bottomSafeArea: {
    backgroundColor: '#f3f4f6',
  },
  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    shadowColor: 'transparent',
    elevation: 0,
  },
  navPlaceholder: {
    width: 48,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  navLink: {
    fontSize: 15,
    color: '#2563eb',
  },
  navBold: {
    fontWeight: '600',
  },
  deleteLink: {
    color: '#dc2626',
  },
  navDisabled: {
    opacity: 0.4,
  },
  card: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    height: 90,
  },
  cardPressed: {
    backgroundColor: '#f3f4f6',
  },
  colorStripe: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  cardText: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 6,
    flex: 1,
    overflow: 'hidden',
  },
  groupTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    borderWidth: 1,
  },
  checkContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  checkCircleSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
  },
  swipeDelete: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    marginTop: 14,
    marginRight: 12,
    borderRadius: 16,
  },
  swipeDeleteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

