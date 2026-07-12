import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { QueenHistoryDraftEntry, QueenProfileDraft, getQueenMarkingColorFromYear, getQueenMarkingColorMismatch, queenMarkingColors, queenStatuses } from '@/lib/queen';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { QueenMarkingColor } from '@/types/domain';

type QueenProfileFieldsProps = {
  value: QueenProfileDraft;
  onChange: (next: QueenProfileDraft) => void;
  onAddHistoryEntry: () => void;
  onRemoveHistoryEntry: (entryId: string) => void;
};

export const QueenProfileFields = memo(function QueenProfileFields({ value, onChange, onAddHistoryEntry, onRemoveHistoryEntry }: QueenProfileFieldsProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const suggestedColor = getQueenMarkingColorFromYear(value.queenYear);
  const colorMismatch = getQueenMarkingColorMismatch(value.queenYear, value.queenMarkingColor);

  function updateEntry(entryId: string, patch: Partial<QueenHistoryDraftEntry>) {
    onChange({
      ...value,
      queenHistory: value.queenHistory.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)),
    });
  }

  function handleYearChange(next: string) {
    const cleaned = next.replace(/[^0-9]/g, '');
    const autoColor = getQueenMarkingColorFromYear(cleaned);

    // Auto-föreslå färg om fältet är tomt och år är komplett
    if (autoColor && !value.queenMarkingColor) {
      onChange({ ...value, queenYear: cleaned, queenMarkingColor: autoColor });
    } else {
      onChange({ ...value, queenYear: cleaned });
    }
  }

  /** Färgkoderna för de internationella märkningsfärgerna */
  const colorHexMap: Record<QueenMarkingColor, string> = {
    'Vit': '#FFFFFF',
    'Gul': '#F5C518',
    'Röd': '#E8312A',
    'Grön': '#2DB84B',
    'Blå': '#3B82F6',
    'Omärkt': 'transparent',
  };

  return (
    <View style={styles.container}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Drottningstatus</Text>
        <View style={styles.optionGrid}>
          {queenStatuses.map((status) => {
            const selected = status === value.queenStatus;

            return (
              <Pressable key={status} onPress={() => onChange({ ...value, queenStatus: status })} style={[styles.option, selected && styles.optionSelected]}>
                <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{status}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Drottningens år</Text>
        <TextInput
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={handleYearChange}
          placeholder="Exempel: 2025"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={value.queenYear}
        />
        {suggestedColor && !value.queenMarkingColor ? (
          <Text style={styles.hintText}>Enligt det internationella systemet: år {value.queenYear} → {suggestedColor.toLowerCase()}</Text>
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Märkningsfärg</Text>
        <Text style={[theme.textStyles.caption, { marginBottom: 4 }]}>
          Int. system: 1/6=Vit · 2/7=Gul · 3/8=Röd · 4/9=Grön · 5/0=Blå
        </Text>
        <View style={styles.optionGrid}>
          {queenMarkingColors.map((color) => {
            const selected = color === value.queenMarkingColor;
            const hex = colorHexMap[color];
            const showDot = color !== 'Omärkt';

            return (
              <Pressable key={color} onPress={() => onChange({ ...value, queenMarkingColor: color })} style={[styles.option, selected && styles.optionSelected]}>
                <View style={styles.colorOptionRow}>
                  {showDot ? (
                    <View style={[styles.colorDot, { backgroundColor: hex, borderColor: selected ? theme.colors.surface : theme.colors.border }]} />
                  ) : null}
                  <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{color}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {colorMismatch ? (
          <View style={styles.mismatchBox}>
            <Text style={styles.mismatchText}>⚠️ {colorMismatch}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Ursprung</Text>
        <TextInput
          onChangeText={(next) => onChange({ ...value, queenOrigin: next })}
          placeholder="Exempel: avläggare eller inköpt"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={value.queenOrigin}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Datum för införande</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={(next) => onChange({ ...value, queenIntroducedAt: next })}
          placeholder="ÅÅÅÅ-MM-DD"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={value.queenIntroducedAt}
        />
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.historyHeader}>
          <View style={styles.historyText}>
            <Text style={styles.label}>Historik</Text>
            <Text style={theme.textStyles.caption}>Lägg till byten eller korta milstolpar.</Text>
          </View>
          <PrimaryButton label="Lägg till rad" onPress={onAddHistoryEntry} size="compact" variant="secondary" />
        </View>

        {value.queenHistory.length ? (
          <View style={styles.historyList}>
            {value.queenHistory.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={4}
                  onChangeText={(next) => updateEntry(entry.id, { year: next.replace(/[^0-9]/g, '') })}
                  placeholder="År"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, styles.historyYearInput]}
                  value={entry.year}
                />
                <TextInput
                  onChangeText={(next) => updateEntry(entry.id, { note: next })}
                  placeholder="Exempel: ersatt med ny drottning"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, styles.historyNoteInput]}
                  value={entry.note}
                />
                <PrimaryButton label="Ta bort" onPress={() => onRemoveHistoryEntry(entry.id)} size="compact" variant="ghost" />
              </View>
            ))}
          </View>
        ) : (
          <Text style={theme.textStyles.caption}>Ingen historik sparad ännu.</Text>
        )}
      </View>
    </View>
  );
});

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.lg,
    },
    fieldGroup: {
      gap: theme.spacing.sm,
    },
    label: {
      ...theme.textStyles.label,
      color: theme.colors.textMuted,
    },
    input: {
      minHeight: 56,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      ...theme.textStyles.body,
      color: theme.colors.text,
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    option: {
      minHeight: 56,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    optionSelected: {
      backgroundColor: theme.colors.sage,
      borderColor: theme.colors.sage,
    },
    optionLabel: {
      ...theme.textStyles.bodyStrong,
      textAlign: 'center',
      flexShrink: 1,
    },
    optionSelectedText: {
      color: theme.colors.surface,
    },
    colorOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    colorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1,
    },
    hintText: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
      fontStyle: 'italic',
    },
    mismatchBox: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radii.md,
      padding: theme.spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.severityColors.warning.text,
    },
    mismatchText: {
      ...theme.textStyles.caption,
      color: theme.colors.text,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    historyText: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    historyList: {
      gap: theme.spacing.md,
    },
    historyRow: {
      gap: theme.spacing.sm,
    },
    historyYearInput: {
      minWidth: 120,
    },
    historyNoteInput: {
      flex: 1,
    },
  });
}