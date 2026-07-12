import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatCoordinates } from '@/lib/mapLinks';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { ApiaryLocationDetails, Coordinates } from '@/types/domain';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

type ApiaryLocationFieldProps = {
  location: string;
  onLocationChange: (value: string) => void;
  coordinates?: Coordinates;
  onCoordinatesChange: (value?: Coordinates) => void;
  locationDetails?: ApiaryLocationDetails;
  onLocationDetailsChange: (value?: ApiaryLocationDetails) => void;
};

function cleanSegment(value?: string | null) {
  return value?.trim() || undefined;
}

function looksLikeStreetOrAddress(value: string) {
  const normalized = value.toLowerCase();

  return /\d/.test(normalized) || normalized.includes('väg') || normalized.includes('gatan') || normalized.includes('gata') || normalized.includes('street') || normalized.includes('road');
}

function extractMunicipality(result: Location.LocationGeocodedAddress) {
  const city = cleanSegment(result.city);
  const subregion = cleanSegment(result.subregion);
  const district = cleanSegment(result.district);
  const region = cleanSegment(result.region);

  if (city) {
    return city;
  }

  if (subregion && subregion.toLowerCase() !== region?.toLowerCase()) {
    return subregion;
  }

  if (district && !looksLikeStreetOrAddress(district)) {
    return district;
  }

  return undefined;
}

function formatLocationFromReverseGeocode(result: Location.LocationGeocodedAddress) {
  const municipality = extractMunicipality(result);
  const county = cleanSegment(result.region);
  const locality = cleanSegment(result.name);
  const segments = [municipality, locality, county].filter((segment, index, arr) => Boolean(segment) && arr.indexOf(segment) === index);
  return segments.join(', ');
}

function inferZone(latitude: number): ApiaryLocationDetails['zone'] {
  if (latitude >= 62) {
    return 'nord';
  }

  if (latitude < 57.5) {
    return 'syd';
  }

  return 'mellan';
}

function toLocationDetails(result: Location.LocationGeocodedAddress, latitude?: number): ApiaryLocationDetails {
  return {
    source: 'auto',
    locality: cleanSegment(result.city) || cleanSegment(result.name),
    municipality: extractMunicipality(result),
    county: cleanSegment(result.region),
    countryCode: cleanSegment(result.isoCountryCode),
    zone: latitude === undefined ? undefined : inferZone(latitude),
  };
}

export function ApiaryLocationField({
  location,
  onLocationChange,
  coordinates,
  onCoordinatesChange,
  locationDetails,
  onLocationDetailsChange,
}: ApiaryLocationFieldProps) {
  const theme = useTheme();
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasTrustedMunicipality = locationDetails?.source === 'auto' || Boolean(locationDetails?.county?.trim()) || Boolean(coordinates);
  const detectedPlace = hasTrustedMunicipality ? [locationDetails?.municipality, locationDetails?.county].filter(Boolean).join(', ') : '';
  const locationModeLabel = locationDetails?.source === 'manual' ? 'Manuellt justerad plats' : 'Automatisk platsupplösning';
  const utilityMessage = coordinates
    ? 'Positionen hjälper appen att visa väder vid genomgångar och ge mer träffsäkra råd.'
    : 'Lägg gärna till GPS-position. Då kan appen hämta väder vid genomgångar och anpassa råden bättre.';

  async function captureCurrentLocation() {
    try {
      setIsFetchingLocation(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Platsåtkomst nekad', 'Tillåt platsåtkomst för att hämta bigårdens position från enheten.');
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

      let nextDetails: ApiaryLocationDetails | undefined;

      try {
        const [reverseResult] = await Location.reverseGeocodeAsync(nextCoordinates);

        if (reverseResult) {
          const formatted = formatLocationFromReverseGeocode(reverseResult);
          nextDetails = toLocationDetails(reverseResult, nextCoordinates.latitude);

          if (!location.trim() && formatted) {
            onLocationChange(formatted);
          }

          onLocationDetailsChange(nextDetails);
        }
      } catch {
      }

      if (!nextDetails) {
        onLocationDetailsChange({
          source: locationDetails?.source === 'manual' ? 'manual' : 'auto',
          zone: inferZone(nextCoordinates.latitude),
        });
      }
    } catch {
      Alert.alert('Kunde inte hämta plats', 'Kontrollera att platsdelning är tillgänglig på enheten och försök igen.');
    } finally {
      setIsFetchingLocation(false);
    }
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>Plats</Text>
      <TextInput
        onChangeText={(value) => {
          const willUseManualSource = value.trim().length > 0;

          if (willUseManualSource && coordinates) {
            // Manual place entry should not keep stale GPS from another location.
            onCoordinatesChange(undefined);
          }

          onLocationChange(value);
          onLocationDetailsChange({
            ...locationDetails,
            source: 'manual',
            zone: undefined,
          });
        }}
        placeholder="Ort, område eller gårdsnamn"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        value={location}
      />
      <Text style={styles.helperText}>Använd min plats när du är vid bigården. Annars kan du skriva platsen manuellt.</Text>
      <View style={[styles.utilityCard, coordinates && styles.utilityCardReady]}>
        <Text style={styles.utilityTitle}>{coordinates ? 'Position sparad' : 'Rekommenderat'}</Text>
        {locationDetails ? <Text style={styles.utilityMeta}>{locationModeLabel}</Text> : null}
        {detectedPlace ? <Text style={styles.utilityMeta}>Kommun: {detectedPlace}</Text> : null}
        <Text style={styles.utilityText}>{utilityMessage}</Text>
      </View>
      {coordinates ? <Text style={styles.coordinateText}>Sparad position: {formatCoordinates(coordinates)}</Text> : null}
      <View style={styles.actions}>
        <PrimaryButton
          label={isFetchingLocation ? 'Hämtar plats...' : 'Använd min plats'}
          onPress={() => {
            void captureCurrentLocation();
          }}
          variant="secondary"
          size="compact"
          iconName="locate-outline"
        />
        {coordinates ? (
          <PrimaryButton
            label="Rensa position"
            onPress={() => {
              onCoordinatesChange(undefined);
              onLocationDetailsChange({
                ...locationDetails,
                source: 'manual',
                zone: undefined,
              });
            }}
            variant="ghost"
            size="compact"
            iconName="close-outline"
          />
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
    utilityMeta: {
      ...theme.textStyles.caption,
      color: theme.colors.text,
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
}