import { describe, expect, it } from 'vitest';

import {
  extractMunicipality,
  formatLocationFromReverseGeocode,
  inferZone,
  toLocationDetails,
} from '@/lib/locationGeocode';

describe('extractMunicipality', () => {
  it('prefers subregion over city when subregion differs from region', () => {
    expect(
      extractMunicipality({
        city: 'Bålsta',
        subregion: 'Håbo kommun',
        region: 'Uppsala län',
      }),
    ).toBe('Håbo kommun');
  });

  it('falls back to city when subregion is empty or matches region', () => {
    expect(
      extractMunicipality({
        city: 'Uppsala',
        subregion: 'Uppsala län',
        region: 'Uppsala län',
      }),
    ).toBe('Uppsala');

    expect(
      extractMunicipality({
        city: 'Västerås',
        subregion: null,
        region: 'Västmanlands län',
      }),
    ).toBe('Västerås');
  });

  it('falls back to non-street district when subregion and city are missing', () => {
    expect(
      extractMunicipality({
        district: 'Gamla Uppsala',
        region: 'Uppsala län',
      }),
    ).toBe('Gamla Uppsala');

    expect(
      extractMunicipality({
        district: 'Storgatan 12',
        region: 'Uppsala län',
      }),
    ).toBeUndefined();
  });
});

describe('formatLocationFromReverseGeocode and toLocationDetails', () => {
  it('ignores street addresses and house numbers in result.name', () => {
    const address = {
      name: 'Storgatan 12',
      street: 'Storgatan',
      streetNumber: '12',
      city: 'Bålsta',
      subregion: 'Håbo kommun',
      region: 'Uppsala län',
      isoCountryCode: 'SE',
    };

    expect(formatLocationFromReverseGeocode(address)).toBe('Håbo kommun, Bålsta, Uppsala län');
    expect(toLocationDetails(address, 59.567)).toEqual({
      source: 'auto',
      locality: 'Bålsta',
      municipality: 'Håbo kommun',
      county: 'Uppsala län',
      countryCode: 'SE',
      zone: 'mellan',
    });
  });

  it('ignores result.name when it matches street or streetNumber without digits', () => {
    const address = {
      name: 'Storgatan',
      street: 'Storgatan',
      city: 'Uppsala',
      subregion: 'Uppsala kommun',
      region: 'Uppsala län',
    };

    expect(formatLocationFromReverseGeocode(address)).toBe('Uppsala kommun, Uppsala, Uppsala län');
    expect(toLocationDetails(address).locality).toBe('Uppsala');
  });

  it('ignores numeric result.name and falls back to subregion when city is missing', () => {
    const address = {
      name: '12',
      streetNumber: '12',
      subregion: 'Håbo kommun',
      region: 'Uppsala län',
    };

    expect(formatLocationFromReverseGeocode(address)).toBe('Håbo kommun, Uppsala län');
    expect(toLocationDetails(address).locality).toBe('Håbo kommun');
  });

  it('uses result.name as locality when it is a place name', () => {
    const address = {
      name: 'Ekeby',
      city: 'Uppsala',
      subregion: 'Uppsala kommun',
      region: 'Uppsala län',
      isoCountryCode: 'SE',
    };

    expect(formatLocationFromReverseGeocode(address)).toBe('Uppsala kommun, Ekeby, Uppsala län');
    expect(toLocationDetails(address, 59.8586)).toEqual({
      source: 'auto',
      locality: 'Ekeby',
      municipality: 'Uppsala kommun',
      county: 'Uppsala län',
      countryCode: 'SE',
      zone: 'mellan',
    });
  });
});

describe('inferZone', () => {
  it('maps latitudes to nord, mellan, and syd', () => {
    expect(inferZone(63.8)).toBe('nord');
    expect(inferZone(59.8)).toBe('mellan');
    expect(inferZone(55.6)).toBe('syd');
  });
});
