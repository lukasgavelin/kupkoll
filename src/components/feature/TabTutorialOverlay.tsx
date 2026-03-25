import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { AppCard } from '@/components/ui/AppCard';
import { theme } from '@/theme';

type TabTutorialOverlayProps = {
  visible: boolean;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  activeIndex: number;
  nextLabel: string;
  onNext: () => void;
  onClose: () => void;
};

export function TabTutorialOverlay({ visible, title, description, step, totalSteps, activeIndex, nextLabel, onNext, onClose }: TabTutorialOverlayProps) {
  const { width } = useWindowDimensions();

  const tabBarOuterWidth = width - theme.spacing.lg * 2;
  const tabSlotWidth = tabBarOuterWidth / totalSteps;
  const highlightWidth = Math.max(tabSlotWidth - theme.spacing.md, 52);
  const highlightLeft = theme.spacing.lg + activeIndex * tabSlotWidth + (tabSlotWidth - highlightWidth) / 2;
  const animatedLeft = useRef(new Animated.Value(highlightLeft)).current;
  const animatedWidth = useRef(new Animated.Value(highlightWidth)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedLeft, {
        toValue: highlightLeft,
        useNativeDriver: false,
        damping: 16,
        stiffness: 180,
        mass: 0.7,
      }),
      Animated.spring(animatedWidth, {
        toValue: highlightWidth,
        useNativeDriver: false,
        damping: 16,
        stiffness: 180,
        mass: 0.7,
      }),
    ]).start();
  }, [animatedLeft, animatedWidth, highlightLeft, highlightWidth]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Pressable onPress={onClose} style={styles.backdrop} />
      <Animated.View pointerEvents="none" style={[styles.tabHighlight, { width: animatedWidth, left: animatedLeft }]}>
        <Text style={styles.tabHighlightLabel}>Den här fliken</Text>
      </Animated.View>
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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35, 48, 43, 0.34)',
  },
  card: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: 150,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceRaised,
    gap: theme.spacing.xl,
  },
  tabHighlight: {
    position: 'absolute',
    bottom: 52,
    minHeight: 58,
    borderRadius: theme.radii.pill,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.floating,
  },
  tabHighlightLabel: {
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
  stepBadgeText: {
    ...theme.textStyles.label,
    color: theme.colors.accent,
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