import React from 'react';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { COLORS } from '../styles/Theme';
import { commonStyles } from '../styles/common.styles';

// Root layout using a Stack navigator.
export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        commonStyles.safeAreaContainer,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#FFFFFF',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Welcome' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}


