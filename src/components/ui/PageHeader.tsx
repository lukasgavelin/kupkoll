import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { PrimaryButton } from './PrimaryButton';
import { SectionHeader } from './SectionHeader';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionIconName?: Parameters<typeof PrimaryButton>[0]['iconName'];
};

export function PageHeader({ eyebrow, title, description, actionLabel, onActionPress, actionIconName }: PageHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {actionLabel && onActionPress ? <PrimaryButton label={actionLabel} onPress={onActionPress} variant="secondary" size="compact" iconName={actionIconName} /> : null}
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.lg,
  },
});