import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, usePathname } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { FirstRunTutorialPrompt } from '@/components/feature/FirstRunTutorialPrompt';
import { TabTutorialOverlay } from '@/components/feature/TabTutorialOverlay';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

const tutorialSteps = [
  {
    path: '/',
    title: 'Hem',
    description: 'Här får du dagens lägesbild för biodlingen med viktiga varningar, närmaste arbetsmoment och senaste genomgångar.',
  },
  {
    path: '/apiaries',
    title: 'Bigårdar',
    description: 'Här ser du varje bigårdsläge med anteckningar om plats, dragförutsättningar och hur många samhällen som står där.',
  },
  {
    path: '/hives',
    title: 'Kupor',
    description: 'Här får du överblick över samhällsstyrka, drottningstatus, kupsystem och senaste genomgång för varje kupa.',
  },
  {
    path: '/tasks',
    title: 'Uppgifter',
    description: 'Här samlas egen planering och beslutstöd, till exempel vårgenomgång, svärmkontroll, stödfodring och invintring.',
  },
  {
    path: '/settings',
    title: 'Inställningar',
    description: 'Här ser du appens biodlingsprofil och vad som redan stöds eller är förberett för senare versioner.',
  },
] as const;

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return <Ionicons color={color} name={name} size={focused ? 22 : 20} />;
}

export default function TabsLayout() {
  const pathname = usePathname();
  const { completeTabTutorial, skipTabTutorial, startTabTutorial, tabTutorialPromptVisible, tabTutorialReady, tabTutorialVisible } = useKupkoll();

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
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.text,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: 'absolute',
            left: theme.spacing.lg,
            right: theme.spacing.lg,
            bottom: theme.spacing.lg,
            height: 78,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.sm,
            paddingHorizontal: theme.spacing.sm,
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
        nextLabel={activeTutorialIndex === tutorialSteps.length - 1 ? 'Klar' : 'Nästa flik'}
        onNext={goToNextTutorialStep}
        onClose={() => {
          void completeTabTutorial();
        }}
      />
    </View>
  );
}