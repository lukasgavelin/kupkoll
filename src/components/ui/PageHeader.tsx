import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrapper}>
      {actionLabel && onActionPress ? <PrimaryButton label={actionLabel} onPress={onActionPress} variant="secondary" size="compact" iconName={actionIconName} /> : null}
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrapper: {
      gap: theme.spacing.lg,
    },
  });
}