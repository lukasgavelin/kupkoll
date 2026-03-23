import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function PrimaryButton({ label, onPress, variant = 'primary' }: PrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.button, variant === 'secondary' && styles.secondary]}>
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  label: {
    ...theme.textStyles.bodyStrong,
    color: theme.colors.surface,
  },
  secondaryLabel: {
    color: theme.colors.text,
  },
});