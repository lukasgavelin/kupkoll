import { StyleSheet, Text } from 'react-native';
import { useMemo } from 'react';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

type EmptyStateCardProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyStateCard({ title, description, actionLabel, onActionPress }: EmptyStateCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AppCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onActionPress ? <PrimaryButton fullWidth label={actionLabel} onPress={onActionPress} variant="secondary" /> : null}
    </AppCard>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      borderStyle: 'dashed',
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surface,
    },
    title: {
      ...theme.textStyles.heading,
    },
    description: {
      ...theme.textStyles.body,
      color: theme.colors.textMuted,
    },
  });
}