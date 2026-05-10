import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { AppCard } from '@/components/ui/AppCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { loadEventsForHiveSync, loadInspectionsForHiveSync } from '@/lib/db';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { HiveEvent, Inspection } from '@/types/domain';

export default function HiveTrendsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { getHiveById } = useKupkoll();
  const hive = getHiveById(params.id);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [events, setEvents] = useState<HiveEvent[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (hive) {
        // Load full history
        setInspections(loadInspectionsForHiveSync(hive.id).reverse()); // Oldest first for charts
        setEvents(loadEventsForHiveSync(hive.id));
      }
    }, [hive?.id])
  );

  if (!hive) {
    return (
      <Screen>
        <AppCard>
          <Text style={theme.textStyles.heading}>Kupan hittades inte</Text>
          <PrimaryButton label="Tillbaka" onPress={() => router.back()} />
        </AppCard>
      </Screen>
    );
  }

  // Process Varroa Data
  // Map varroa levels to numeric: Låg = 1, Förhöjd = 2, Hög = 3. Ej kontrollerad is skipped or 0.
  const varroaData = inspections
    .filter((i) => i.varroaLevel !== 'Ej kontrollerad')
    .slice(-6); // Max 6 data points to not crowd the chart

  const varroaValues = varroaData.map(i => {
    if (i.varroaLevel === 'Låg') return 1;
    if (i.varroaLevel === 'Förhöjd') return 2;
    if (i.varroaLevel === 'Hög') return 3;
    return 0;
  });

  const varroaLabels = varroaData.map(i => {
    const d = new Date(i.performedAt);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  // Process Harvest Data (Skörd)
  const harvestEvents = events.filter(e => e.type === 'Skattning/slungning');
  
  const screenWidth = Dimensions.get('window').width - theme.spacing.lg * 2;

  return (
    <Screen>
      <PageHeader
        actionLabel="Tillbaka"
        actionIconName="chevron-back"
        onActionPress={() => router.back()}
        eyebrow="Analys"
        title={`Trender för ${hive.name}`}
        description="Följ upp varroatryck och skörd över tid."
      />

      <AppCard>
        <Text style={theme.textStyles.heading}>Varroautveckling</Text>
        <Text style={theme.textStyles.caption}>Visar de senaste mätningarna. 1 = Låg, 2 = Förhöjd, 3 = Hög.</Text>
        
        {varroaValues.length > 0 ? (
          <View style={styles.chartWrapper}>
            <LineChart
              data={{
                labels: varroaLabels,
                datasets: [
                  {
                    data: varroaValues,
                  },
                  { data: [0], withDots: false }, // Force yAxis min to 0
                  { data: [3], withDots: false }  // Force yAxis max to 3
                ],
              }}
              width={screenWidth - theme.spacing.lg * 2} // Padding compensation
              height={220}
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.colors.accent,
                labelColor: (opacity = 1) => theme.colors.textMuted,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: theme.colors.accent,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        ) : (
          <Text style={[theme.textStyles.body, { marginTop: 16 }]}>
            Inte tillräckligt med varroamätningar för att visa en trend.
          </Text>
        )}
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>Skörd</Text>
        <Text style={theme.textStyles.caption}>Slungning och skattning som loggats för denna kupa.</Text>
        
        {harvestEvents.length > 0 ? (
          <View style={{ marginTop: 16, gap: 16 }}>
            {harvestEvents.map(e => (
              <View key={e.id} style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 8 }}>
                <Text style={theme.textStyles.bodyStrong}>{new Date(e.performedAt).toLocaleDateString()}</Text>
                <Text style={theme.textStyles.body}>{e.details?.harvestSummary || e.notes || 'Ingen detaljerad info.'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[theme.textStyles.body, { marginTop: 16 }]}>
            Ingen skörd registrerad ännu.
          </Text>
        )}
      </AppCard>

    </Screen>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    alignItems: 'center',
    marginTop: 16,
  },
});
