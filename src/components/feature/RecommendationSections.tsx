import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { groupRecommendations } from '@/lib/recommendations';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { Recommendation } from '@/types/domain';
import { RecommendationCard } from './Cards';
import { SectionHeader } from '../ui/SectionHeader';

export function RecommendationSections({ recommendations, getHiveName, getRelatedTaskLabel }: { recommendations: Recommendation[]; getHiveName: (hiveId: string) => string; getRelatedTaskLabel?: (recommendation: Recommendation) => string | undefined }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const groups = groupRecommendations(recommendations);

  return (
    <View style={styles.wrapper}>
      {groups.map((group) => (
        <View key={group.kind} style={styles.group}>
          <SectionHeader title={group.title} description={group.description} />
          <View style={styles.list}>
            {group.items.map((recommendation) => (
              <RecommendationCard key={recommendation.id} hiveName={getHiveName(recommendation.hiveId)} recommendation={recommendation} relatedTaskLabel={getRelatedTaskLabel?.(recommendation)} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrapper: {
      gap: theme.spacing.xl,
    },
    group: {
      gap: theme.spacing.md,
    },
    list: {
      gap: theme.spacing.lg,
    },
  });
}