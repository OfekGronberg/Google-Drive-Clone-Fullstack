import React, { useEffect, useMemo } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { getUserId, request } from '../src/api/CommunicationManager';

// Root layout - simple Stack navigation
function RootLayoutContent() {
  const { colors, setTheme } = useTheme();
  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors]
  );

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      return;
    }

    request({
      method: 'GET',
      path: `/api/users/${userId}`,
    })
      .then((user) => {
        if (user?.theme) {
          setTheme(user.theme);
        }
      })
      .catch(() => {});
  }, [setTheme]);

  return (
    <View style={themedStyles.container}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="health" options={{ title: 'API Health' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="edit" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
