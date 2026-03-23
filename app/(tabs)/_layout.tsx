import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { theme } from '@/theme';

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return <Ionicons color={color} name={name} size={focused ? 22 : 20} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 84,
          paddingTop: 10,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamilies.semibold,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hem', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="home-outline" /> }} />
      <Tabs.Screen name="apiaries" options={{ title: 'Bigårdar', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="leaf-outline" /> }} />
      <Tabs.Screen name="hives" options={{ title: 'Kupor', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="grid-outline" /> }} />
      <Tabs.Screen name="tasks" options={{ title: 'Uppgifter', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="checkbox-outline" /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Inställningar', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="options-outline" /> }} />
    </Tabs>
  );
}