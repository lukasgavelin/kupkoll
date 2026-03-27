import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingTabBarProvider } from '@/store/FloatingTabBarContext';
import { useTheme } from '@/store/ThemeContext';

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return <Ionicons color={color} name={name} size={focused ? 22 : 20} />;
}

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHorizontalInset = theme.spacing.lg;
  const tabBarInnerPadding = theme.spacing.xs;
  const tabBarTopPadding = 4;
  const tabBarBottomPadding = Math.max(theme.spacing.xs, insets.bottom);
  const tabBarBottomOffset = Platform.OS === 'ios' ? Math.max(insets.bottom, theme.spacing.sm) : 0;
  const tabBarHeight = 56 + tabBarBottomPadding;
  const tabBarFootprint = tabBarHeight + tabBarBottomOffset;

  return (
    <FloatingTabBarProvider bottomSpacing={tabBarFootprint}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.text,
            tabBarInactiveTintColor: theme.colors.textMuted,
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              position: 'absolute',
              left: tabBarHorizontalInset,
              right: tabBarHorizontalInset,
              bottom: tabBarBottomOffset,
              height: tabBarHeight,
              paddingTop: tabBarTopPadding,
              paddingBottom: tabBarBottomPadding,
              paddingHorizontal: tabBarInnerPadding,
              borderTopWidth: 0,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
              backgroundColor: theme.colors.surfaceRaised,
              ...theme.shadows.floating,
            },
            tabBarItemStyle: {
              borderRadius: theme.radii.pill,
            },
            tabBarLabelStyle: {
              fontFamily: theme.fontFamilies.semibold,
              fontSize: 11,
              paddingBottom: 2,
            },
            tabBarBackground: () => <View style={{ flex: 1, borderRadius: theme.radii.xl, backgroundColor: theme.colors.surfaceRaised }} />,
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Hem', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="home-outline" /> }} />
          <Tabs.Screen name="apiaries" options={{ title: 'Bigårdar', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="leaf-outline" /> }} />
          <Tabs.Screen name="hives" options={{ title: 'Kupor', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="grid-outline" /> }} />
          <Tabs.Screen name="tasks" options={{ title: 'Uppgifter', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="checkbox-outline" /> }} />
          <Tabs.Screen name="settings" options={{ title: 'Inställningar', tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="options-outline" /> }} />
        </Tabs>
      </View>
    </FloatingTabBarProvider>
  );
}