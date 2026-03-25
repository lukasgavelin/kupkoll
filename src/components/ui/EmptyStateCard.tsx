import { StyleSheet, Text } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { theme } from '@/theme';

type EmptyStateCardProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyStateCard({ title, description, actionLabel, onActionPress }: EmptyStateCardProps) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onActionPress ? <PrimaryButton fullWidth label={actionLabel} onPress={onActionPress} variant="secondary" /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
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