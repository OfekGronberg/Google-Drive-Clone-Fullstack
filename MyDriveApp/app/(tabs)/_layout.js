import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Drive',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="shared"
        options={{
          title: 'Shared',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="starred"
        options={{
          title: 'Starred',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="trash"
        options={{
          title: 'Trash',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trash" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
