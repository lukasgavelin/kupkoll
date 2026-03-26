import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, usePathname } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FirstRunTutorialPrompt } from '@/components/feature/FirstRunTutorialPrompt';
import { TabTutorialOverlay } from '@/components/feature/TabTutorialOverlay';
import { FloatingTabBarProvider } from '@/store/FloatingTabBarContext';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';

const tutorialSteps = [
  {
    path: '/',
    title: 'Hem',
    description: 'Här börjar du med nästa steg, ser vad som behöver följas upp och påminns om vad som hände senast.',
  },
  {
    path: '/apiaries',
    title: 'Bigårdar',
    description: 'Här samlar du dina platser och ser vilka kupor som står i varje bigård.',
  },
  {
    path: '/hives',
    title: 'Kupor',
    description: 'Här får du en enkel överblick över varje kupa och hur läget verkar just nu.',
  },
  {
    path: '/tasks',
    title: 'Uppgifter',
    description: 'Här håller du ihop arbetslistan, från sådant som är bråttom nu till sådant som kan vänta lite.',
  },
  {
    path: '/settings',
    title: 'Inställningar',
    description: 'Här hittar du backup av din information och kan visa guidningen igen när du vill.',
  },
] as const;

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return <Ionicons color={color} name={name} size={focused ? 22 : 20} />;
}

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { completeTabTutorial, skipTabTutorial, startTabTutorial, tabTutorialPromptVisible, tabTutorialReady, tabTutorialVisible } = useKupkoll();
  const tabBarHorizontalInset = theme.spacing.lg;
  const tabBarInnerPadding = theme.spacing.xs;
  const tabBarTopPadding = 4;
  const tabBarBottomPadding = Math.max(theme.spacing.xs, insets.bottom);
  const tabBarBottomOffset = Math.max(insets.bottom, theme.spacing.sm);
  const tabBarHeight = 56 + tabBarBottomPadding;
  const tabBarFootprint = tabBarHeight + tabBarBottomOffset;

  const activeTutorialIndex = useMemo(() => tutorialSteps.findIndex((step) => step.path === pathname), [pathname]);
  const activeStep = activeTutorialIndex >= 0 ? tutorialSteps[activeTutorialIndex] : null;

  function goToNextTutorialStep() {
    if (activeTutorialIndex < 0) {
      void completeTabTutorial();
      return;
    }

    const nextStep = tutorialSteps[activeTutorialIndex + 1];

    if (!nextStep) {
      void completeTabTutorial();
      return;
    }

    router.navigate(nextStep.path);
  }

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

        <FirstRunTutorialPrompt
          visible={tabTutorialReady && tabTutorialPromptVisible}
          onStart={() => {
            void startTabTutorial();
          }}
          onSkip={() => {
            void skipTabTutorial();
          }}
        />

        <TabTutorialOverlay
          visible={tabTutorialReady && tabTutorialVisible && Boolean(activeStep)}
          title={activeStep?.title ?? ''}
          description={activeStep?.description ?? ''}
          step={activeTutorialIndex + 1}
          totalSteps={tutorialSteps.length}
          activeIndex={Math.max(activeTutorialIndex, 0)}
          tabBarBottomOffset={tabBarBottomOffset}
          tabBarHeight={tabBarHeight}
          tabBarHorizontalInset={tabBarHorizontalInset}
          tabBarInnerPadding={tabBarInnerPadding}
          tabBarTopPadding={tabBarTopPadding}
          tabBarBottomPadding={tabBarBottomPadding}
          nextLabel={activeTutorialIndex === tutorialSteps.length - 1 ? 'Klar' : 'Nästa flik'}
          onNext={goToNextTutorialStep}
          onClose={() => {
            void completeTabTutorial();
          }}
        />
      </View>
    </FloatingTabBarProvider>
  );
}