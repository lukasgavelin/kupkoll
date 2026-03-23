import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { theme } from '@/theme';

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.wrapper}>
        <Text style={theme.textStyles.display}>Sidan finns inte</Text>
        <Text style={theme.textStyles.body}>Den här vyn verkar ha tappat sin rutt. Gå tillbaka till hemöversikten.</Text>
        <PrimaryButton label="Till hem" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
});