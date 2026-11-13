import { useMemo } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen>
      <View style={styles.wrapper}>
        <Text style={theme.textStyles.display}>Sidan finns inte</Text>
        <Text style={theme.textStyles.body}>Sidan kunde inte hittas. Gå tillbaka till startsidan.</Text>
        <PrimaryButton label="Till hem" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrapper: {
      paddingTop: theme.spacing.xxxl,
      gap: theme.spacing.lg,
    },
  });
}