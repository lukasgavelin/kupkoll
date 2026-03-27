import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { QueenHistoryDraftEntry, QueenProfileDraft, queenMarkingColors, queenStatuses } from '@/lib/queen';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

type QueenProfileFieldsProps = {
  value: QueenProfileDraft;
  onChange: (next: QueenProfileDraft) => void;
  onAddHistoryEntry: () => void;
  onRemoveHistoryEntry: (entryId: string) => void;
};

export const QueenProfileFields = memo(function QueenProfileFields({ value, onChange, onAddHistoryEntry, onRemoveHistoryEntry }: QueenProfileFieldsProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  function updateEntry(entryId: string, patch: Partial<QueenHistoryDraftEntry>) {
    onChange({
      ...value,
      queenHistory: value.queenHistory.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)),
    });
  }

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
          onChangeText={(next) => onChange({ ...value, queenYear: next.replace(/[^0-9]/g, '') })}
          placeholder="Till exempel 2025"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={value.queenYear}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Märkningsfärg</Text>
        <View style={styles.optionGrid}>
          {queenMarkingColors.map((color) => {
            const selected = color === value.queenMarkingColor;

            return (
              <Pressable key={color} onPress={() => onChange({ ...value, queenMarkingColor: color })} style={[styles.option, selected && styles.optionSelected]}>
                <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{color}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Ursprung</Text>
        <TextInput
          onChangeText={(next) => onChange({ ...value, queenOrigin: next })}
          placeholder="Till exempel ursprunglig drottning, avläggare eller inköpt"
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
            <Text style={theme.textStyles.caption}>Lägg till byten eller korta milstolpar, till exempel 2024 ursprunglig drottning och 2025 ersatt.</Text>
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
                  placeholder="Till exempel ersatt med ny drottning"
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