import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/hooks/useAuth';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { initializing } = useAuth();

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>
          読み込み中...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: { 
              backgroundColor: '#ffffff',
              shadowColor: 'transparent',
              elevation: 0,
            },
            headerTitleStyle: { color: '#111827', fontSize: 16, fontWeight: '600' },
            headerTintColor: '#2563eb',
            headerBackTitleVisible: true,
            headerBackTitle: '戻る',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="list" options={{ headerShown: false }} />
          <Stack.Screen
            name="detail/[id]"
            options={{ title: 'メモを編集', headerBackTitle: '戻る' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

