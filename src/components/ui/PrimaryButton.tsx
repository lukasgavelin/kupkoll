import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'compact';
  iconName?: keyof typeof Ionicons.glyphMap;
};

export function PrimaryButton({ label, onPress, variant = 'primary', size = 'default', iconName }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'compact' && styles.buttonCompact,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {iconName ? <Ionicons color={variant === 'primary' ? theme.colors.surface : theme.colors.text} name={iconName} size={18} /> : null}
        <Text style={[styles.label, variant !== 'primary' && styles.secondaryLabel, size === 'compact' && styles.labelCompact]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: 56,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  buttonCompact: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.88,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.textStyles.label,
    color: theme.colors.surface,
  },
  labelCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  secondaryLabel: {
    color: theme.colors.text,
  },
});