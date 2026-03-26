import { ReactNode, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFloatingTabBarSpacing } from '@/store/FloatingTabBarContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const theme = useTheme();
  const floatingTabBarSpacing = useFloatingTabBarSpacing();
  const styles = useMemo(() => createStyles(theme, floatingTabBarSpacing), [theme, floatingTabBarSpacing]);

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[ 'top', 'left', 'right' ]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoider}>
          <View style={[styles.content, contentStyle]}>{children}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[ 'top', 'left', 'right' ]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoider}>
        <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme, floatingTabBarSpacing: number) {
  const baseBottomPadding = theme.spacing.xxxxl + theme.spacing.xxl;
  const bottomPadding = Math.max(baseBottomPadding, floatingTabBarSpacing + theme.spacing.xl);

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.canvas,
    },
    keyboardAvoider: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 920,
      alignSelf: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: bottomPadding,
      gap: theme.spacing.xxl,
    },
  });
}