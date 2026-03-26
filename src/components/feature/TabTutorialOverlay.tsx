import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

type TabTutorialOverlayProps = {
  visible: boolean;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  activeIndex: number;
  tabBarBottomOffset: number;
  tabBarHeight: number;
  tabBarHorizontalInset: number;
  tabBarInnerPadding: number;
  tabBarTopPadding: number;
  tabBarBottomPadding: number;
  nextLabel: string;
  onNext: () => void;
  onClose: () => void;
};

export function TabTutorialOverlay({
  visible,
  title,
  description,
  step,
  totalSteps,
  activeIndex,
  tabBarBottomOffset,
  tabBarHeight,
  tabBarHorizontalInset,
  tabBarInnerPadding,
  tabBarTopPadding,
  tabBarBottomPadding,
  nextLabel,
  onNext,
  onClose,
}: TabTutorialOverlayProps) {
  const theme = useTheme();
  const styles = createStyles(theme, tabBarBottomOffset, tabBarHeight);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Pressable onPress={onClose} style={styles.backdrop} />
      <AppCard style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.textBlock}>
            <Text style={theme.textStyles.overline}>Snabb guide</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{step}/{totalSteps}</Text>
          </View>
        </View>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.actions}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
            <Text style={styles.secondaryActionLabel}>Stäng guidning</Text>
          </Pressable>
          <Pressable onPress={onNext} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
            <Text style={styles.primaryActionLabel}>{nextLabel}</Text>
          </Pressable>
        </View>
      </AppCard>
    </View>
  );
}

function createStyles(theme: Theme, tabBarBottomOffset: number, tabBarHeight: number) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      zIndex: 20,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlaySoft,
    },
    card: {
      marginHorizontal: theme.spacing.xl,
      marginBottom: tabBarBottomOffset + tabBarHeight + theme.spacing.xl,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surfaceRaised,
      gap: theme.spacing.xl,
    },
    stepBadgeText: {
      ...theme.textStyles.label,
      color: theme.colors.accent,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.lg,
    },
    textBlock: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    title: {
      ...theme.textStyles.title,
      fontSize: 28,
      lineHeight: 32,
    },
    stepBadge: {
      minWidth: 52,
      minHeight: 40,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    description: {
      ...theme.textStyles.body,
      color: theme.colors.textMuted,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    secondaryAction: {
      minHeight: 52,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    primaryAction: {
      minHeight: 52,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.text,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    secondaryActionLabel: {
      ...theme.textStyles.label,
      color: theme.colors.text,
    },
    primaryActionLabel: {
      ...theme.textStyles.label,
      color: theme.colors.surface,
    },
    pressed: {
      opacity: 0.88,
    },
  });
}