import { StyleSheet, View } from 'react-native';

import { groupRecommendations } from '@/lib/recommendations';
import { theme } from '@/theme';
import { Recommendation } from '@/types/domain';
import { RecommendationCard } from './Cards';
import { SectionHeader } from '../ui/SectionHeader';

export function RecommendationSections({ recommendations, getHiveName }: { recommendations: Recommendation[]; getHiveName: (hiveId: string) => string }) {
  const groups = groupRecommendations(recommendations);

  return (
    <View style={styles.wrapper}>
      {groups.map((group) => (
        <View key={group.kind} style={styles.group}>
          <SectionHeader title={group.title} description={group.description} />
          <View style={styles.list}>
            {group.items.map((recommendation) => (
              <RecommendationCard key={recommendation.id} hiveName={getHiveName(recommendation.hiveId)} recommendation={recommendation} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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