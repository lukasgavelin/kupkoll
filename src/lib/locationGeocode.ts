import type { LocationGeocodedAddress } from 'expo-location';

import type { ApiaryLocationDetails } from '@/types/domain';

export type ReverseGeocodeAddress = Partial<
  Pick<
    LocationGeocodedAddress,
    'name' | 'city' | 'subregion' | 'district' | 'region' | 'street' | 'streetNumber' | 'isoCountryCode'
  >
>;

function cleanSegment(value?: string | null) {
  return value?.trim() || undefined;
}

function looksLikeStreetOrAddress(value: string) {
  const normalized = value.toLowerCase();

  return (
    /\d/.test(normalized) ||
    normalized.includes('väg') ||
    normalized.includes('gatan') ||
    normalized.includes('gata') ||
    normalized.includes('street') ||
    normalized.includes('road')
  );
}

function isStreetOrNumber(value: string, result: ReverseGeocodeAddress) {
  const normalized = value.toLowerCase();
  const street = cleanSegment(result.street)?.toLowerCase();
  const streetNumber = cleanSegment(result.streetNumber)?.toLowerCase();

  if (street && normalized === street) {
    return true;
  }

  if (streetNumber && normalized === streetNumber) {
    return true;
  }

  return looksLikeStreetOrAddress(value);
}

function isDistinctMunicipalitySubregion(subregion: string | undefined, region: string | undefined): subregion is string {
  if (!subregion) {
    return false;
  }

  const normalized = subregion.toLowerCase();

  if (region && normalized === region.toLowerCase()) {
    return false;
  }

  return !normalized.endsWith(' län');
}

export function extractMunicipality(result: ReverseGeocodeAddress) {
  const city = cleanSegment(result.city);
  const subregion = cleanSegment(result.subregion);
  const district = cleanSegment(result.district);
  const region = cleanSegment(result.region);

  if (isDistinctMunicipalitySubregion(subregion, region)) {
    return subregion;
  }

  if (city) {
    return city;
  }

  if (district && !looksLikeStreetOrAddress(district)) {
    return district;
  }

  return undefined;
}

function extractLocality(result: ReverseGeocodeAddress) {
  const name = cleanSegment(result.name);

  if (name && !isStreetOrNumber(name, result)) {
    return name;
  }

  const city = cleanSegment(result.city);

  if (city) {
    return city;
  }

  const subregion = cleanSegment(result.subregion);
  const region = cleanSegment(result.region);

  if (isDistinctMunicipalitySubregion(subregion, region)) {
    return subregion;
  }

  return undefined;
}

export function formatLocationFromReverseGeocode(result: ReverseGeocodeAddress) {
  const municipality = extractMunicipality(result);
  const county = cleanSegment(result.region);
  const locality = extractLocality(result);
  const segments = [municipality, locality, county].filter(
    (segment, index, arr) => Boolean(segment) && arr.indexOf(segment) === index,
  );

  return segments.join(', ');
}

export function inferZone(latitude: number): ApiaryLocationDetails['zone'] {
  if (latitude >= 62) {
    return 'nord';
  }

  if (latitude < 57.5) {
    return 'syd';
  }

  return 'mellan';
}

export function toLocationDetails(result: ReverseGeocodeAddress, latitude?: number): ApiaryLocationDetails {
  return {
    source: 'auto',
    locality: extractLocality(result),
    municipality: extractMunicipality(result),
    county: cleanSegment(result.region),
    countryCode: cleanSegment(result.isoCountryCode),
    zone: latitude === undefined ? undefined : inferZone(latitude),
  };
}
