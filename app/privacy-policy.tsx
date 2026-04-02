import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { privacyPolicyIntro, privacyPolicyLastUpdated, privacyPolicySections } from '@/data/privacyPolicy';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function PrivacyPolicyScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Screen>
      <SectionHeader
        eyebrow="Integritet"
        title="Integritetspolicy"
        description={`Senast uppdaterad: ${privacyPolicyLastUpdated}`}
      />
      <PrimaryButton
        iconName="arrow-back-outline"
        label="Tillbaka"
        onPress={() => {
          router.back();
        }}
        size="compact"
        variant="ghost"
      />
      <AppCard>
        <View style={styles.content}>
          {privacyPolicyIntro.map((paragraph) => (
            <Text key={paragraph} style={theme.textStyles.body}>
              {paragraph}
            </Text>
          ))}

          {privacyPolicySections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={theme.textStyles.heading}>{section.title}</Text>

              {section.paragraphs?.map((paragraph) => (
                <Text key={`${section.title}-${paragraph}`} style={theme.textStyles.body}>
                  {paragraph}
                </Text>
              ))}

              {section.bullets?.map((bullet) => (
                <View key={`${section.title}-bullet-${bullet}`} style={styles.bulletRow}>
                  <Text style={styles.bulletMarker}>-</Text>
                  <Text style={[theme.textStyles.body, styles.bulletText]}>{bullet}</Text>
                </View>
              ))}

              {section.subsections?.map((subsection) => (
                <View key={`${section.title}-${subsection.title}`} style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>{subsection.title}</Text>

                  {subsection.paragraphs?.map((paragraph) => (
                    <Text key={`${section.title}-${subsection.title}-${paragraph}`} style={theme.textStyles.body}>
                      {paragraph}
                    </Text>
                  ))}

                  {subsection.bullets?.map((bullet) => (
                    <View key={`${section.title}-${subsection.title}-bullet-${bullet}`} style={styles.bulletRow}>
                      <Text style={styles.bulletMarker}>-</Text>
                      <Text style={[theme.textStyles.body, styles.bulletText]}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      </AppCard>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
    },
    section: {
      gap: theme.spacing.sm,
    },
    subsection: {
      gap: theme.spacing.xs,
      paddingTop: theme.spacing.xs,
    },
    subsectionTitle: {
      ...theme.textStyles.label,
      color: theme.colors.text,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    bulletMarker: {
      ...theme.textStyles.body,
      color: theme.colors.text,
      lineHeight: theme.textStyles.body.lineHeight,
    },
    bulletText: {
      flex: 1,
    },
  });
}