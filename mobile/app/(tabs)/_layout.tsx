import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { IconName } from '@/ui';
import { SCHRIFT } from '@/theme/farben';

function TabIcon(name: IconName, aktiv: IconName) {
  return ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? aktiv : name} size={size} color={color} />
  );
}

export default function TabLayout() {
  const { farben } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: farben.flaeche },
        headerTitleStyle: { color: farben.text, fontFamily: SCHRIFT.semibold, fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: farben.flaeche, borderTopColor: farben.rand, borderTopWidth: StyleSheet.hairlineWidth },
        tabBarLabelStyle: { fontFamily: SCHRIFT.medium, fontSize: 11, lineHeight: 14 },
        tabBarActiveTintColor: farben.akzent,
        tabBarInactiveTintColor: farben.text3,
        sceneStyle: { backgroundColor: farben.hintergrund },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Start', tabBarIcon: TabIcon('home-outline', 'home') }} />
      <Tabs.Screen
        name="projekte"
        options={{ title: 'Projekte', tabBarIcon: TabIcon('briefcase-outline', 'briefcase') }}
      />
      <Tabs.Screen
        name="rapporte"
        options={{ title: 'Rapporte', tabBarIcon: TabIcon('create-outline', 'create') }}
      />
      <Tabs.Screen
        name="adressen"
        options={{ title: 'Adressen', tabBarIcon: TabIcon('people-outline', 'people') }}
      />
      <Tabs.Screen
        name="mehr"
        options={{ title: 'Mehr', tabBarIcon: TabIcon('ellipsis-horizontal-circle-outline', 'ellipsis-horizontal-circle') }}
      />
    </Tabs>
  );
}
