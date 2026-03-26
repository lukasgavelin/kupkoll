import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { theme } from '@/theme';

type FirstRunTutorialPromptProps = {
  visible: boolean;
  onStart: () => void;
  onSkip: () => void;
};

export function FirstRunTutorialPrompt({ visible, onStart, onSkip }: FirstRunTutorialPromptProps) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Pressable onPress={onSkip} style={styles.backdrop} />
      <AppCard style={styles.card}>
        <View style={styles.copyBlock}>
          <Text style={theme.textStyles.overline}>Första gången</Text>
          <Text style={styles.title}>Vill du få en kort rundtur i appen?</Text>
          <Text style={styles.description}>Du kan gå igenom Hem, Bigårdar, Kupor, Uppgifter och Inställningar steg för steg, eller hoppa över och börja direkt.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onSkip} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
            <Text style={styles.secondaryActionLabel}>Hoppa över</Text>
          </Pressable>
          <Pressable onPress={onStart} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
            <Text style={styles.primaryActionLabel}>Starta guidning</Text>
          </Pressable>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    zIndex: 24,
    paddingHorizontal: theme.spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35, 48, 43, 0.40)',
  },
  card: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceRaised,
    gap: theme.spacing.xl,
  },
  copyBlock: {
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.textStyles.title,
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