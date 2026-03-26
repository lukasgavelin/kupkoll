import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, View } from 'react-native';

import { buildApiaryMapUrl, formatCoordinates } from '@/lib/mapLinks';
import { theme } from '@/theme';
import { Coordinates } from '@/types/domain';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

type ApiaryLocationFieldProps = {
  location: string;
  onLocationChange: (value: string) => void;
  coordinates?: Coordinates;
  onCoordinatesChange: (value?: Coordinates) => void;
};

function formatLocationFromReverseGeocode(result: Location.LocationGeocodedAddress) {
  const segments = [result.name, result.street, result.city, result.region].filter(Boolean);
  return segments.join(', ');
}

export function ApiaryLocationField({ location, onLocationChange, coordinates, onCoordinatesChange }: ApiaryLocationFieldProps) {
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const mapUrl = buildApiaryMapUrl(location, coordinates);
  const utilityMessage = coordinates
    ? 'Positionen hjälper appen att visa väder för genomgångar och göra råden mer träffsäkra för platsen.'
    : 'Lägg gärna till GPS-positionen också. Då kan appen hämta väder vid genomgångar och anpassa råden bättre för platsen.';

  async function captureCurrentLocation() {
    try {
      setIsFetchingLocation(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Platsåtkomst nekad', 'Tillåt platsåtkomst om du vill fylla i bigårdens position från enheten.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      onCoordinatesChange(nextCoordinates);

      if (!location.trim()) {
        try {
          const [reverseResult] = await Location.reverseGeocodeAsync(nextCoordinates);

          if (reverseResult) {
            const formatted = formatLocationFromReverseGeocode(reverseResult);

            if (formatted) {
              onLocationChange(formatted);
            }
          }
        } catch {
        }
      }
    } catch {
      Alert.alert('Kunde inte hämta plats', 'Kontrollera att platsdelning är tillgänglig på enheten och försök igen.');
    } finally {
      setIsFetchingLocation(false);
    }
  }

  async function openMap() {
    if (!mapUrl) {
      Alert.alert('Ingen plats att visa', 'Ange en plats eller hämta position först.');
      return;
    }

    const canOpen = await Linking.canOpenURL(mapUrl);

    if (!canOpen) {
      Alert.alert('Kunde inte öppna karta', 'Det gick inte att öppna kartlänken på enheten.');
      return;
    }

    await Linking.openURL(mapUrl);
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>Plats</Text>
      <TextInput
        onChangeText={onLocationChange}
        placeholder="Ort, område eller gårdsnamn"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        value={location}
      />
      <Text style={styles.helperText}>Skriv platsen med ord. Lägg gärna till GPS-position också om du vill hitta tillbaka lättare i karta.</Text>
      <View style={[styles.utilityCard, coordinates && styles.utilityCardReady]}>
        <Text style={styles.utilityTitle}>{coordinates ? 'Position sparad' : 'Rekommenderat för bästa nytta'}</Text>
        <Text style={styles.utilityText}>{utilityMessage}</Text>
      </View>
      {coordinates ? <Text style={styles.coordinateText}>Sparad position: {formatCoordinates(coordinates)}</Text> : null}
      <View style={styles.actions}>
        <PrimaryButton
          label={isFetchingLocation ? 'Hämtar plats...' : 'Hämta min plats'}
          onPress={() => {
            void captureCurrentLocation();
          }}
          variant="secondary"
          size="compact"
          iconName="locate-outline"
        />
        <PrimaryButton
          label="Öppna i karta"
          onPress={() => {
            void openMap();
          }}
          variant="ghost"
          size="compact"
          iconName="map-outline"
        />
        {coordinates ? <PrimaryButton label="Rensa position" onPress={() => onCoordinatesChange(undefined)} variant="ghost" size="compact" iconName="close-outline" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  helperText: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
  },
  utilityCard: {
    gap: theme.spacing.xs,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  utilityCardReady: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  utilityTitle: {
    ...theme.textStyles.label,
    color: theme.colors.text,
  },
  utilityText: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
  },
  coordinateText: {
    ...theme.textStyles.caption,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
});