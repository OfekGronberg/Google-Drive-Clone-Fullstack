import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { tabsLayoutStyles } from '../../styles/(tabs)/_layout.styles';

// Main tabs layout for the mobile application.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: insets.bottom,
      }}
    >
      <Tabs
        screenOptions={{
          tabBarStyle: tabsLayoutStyles.tabBar,
          tabBarLabelStyle: tabsLayoutStyles.tabBarLabel,
          headerStyle: tabsLayoutStyles.header,
          headerTitleStyle: tabsLayoutStyles.headerTitle,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
      </Tabs>
    </View>
  );
}


