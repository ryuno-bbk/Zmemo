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
import { AdBanner } from '@/src/components/AdBanner';

// 各メモは独立したアイテムとして扱う（同じグループ名でも別々に表示）
type MemoListItem = {
  key: string;       // ドキュメントID
  id: string;        // ドキュメントID
  groupName: string;
  color?: string;
  text: string;
};

export default function ListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid;
  const { memos } = useMemos({ userId });
  const insets = useSafeAreaInsets();

  // 各メモを独立したアイテムとして表示（ドキュメントIDをキーとして使用）
  const groups: MemoListItem[] = useMemo(() => {
    console.log(`[ListScreen] Processing ${memos.length} memos`);
    
    return memos.map((m) => ({
      key: m.id,        // ドキュメントIDをキーとして使用
      id: m.id,
      groupName: m.groupName || '',
      color: m.color,
      text: m.text,
    }));
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

  const handleRowPress = (item: MemoListItem) => {
    if (selectMode) {
      toggleSelect(item.key);
    } else {
      // ドキュメントIDで直接詳細画面を開く
      router.push(`/detail/${item.id}`);
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
      `${selectedCount} 件のメモを削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              // 選択されたドキュメントIDで直接削除
              await Promise.all(
                Array.from(selectedKeys).map((id) => deleteDoc(doc(db, 'memos', id)))
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

  const confirmDeleteMemo = (item: MemoListItem) => {
    const displayName = item.groupName || 'グループなし';
    Alert.alert(
      '削除確認',
      `「${displayName}」のメモを削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'memos', item.id));
            } catch (e) {
              console.error('Failed to delete memo', e);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (item: MemoListItem) => (
    <TouchableOpacity
      style={styles.swipeDelete}
      onPress={() => confirmDeleteMemo(item)}
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
            groups.length === 0 ? styles.emptyList : styles.listContent
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
                    {item.text}
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
          style={[styles.fab, { bottom: 80 }]}
          onPress={() => router.push('/detail/new')}
        >
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>
      </View>
      
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
  listContent: {
    paddingBottom: 100,
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

