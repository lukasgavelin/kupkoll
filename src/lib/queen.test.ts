import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid',
}));

import { buildQueenInput, isValidIsoDate, isValidYear } from '@/lib/queen';

describe('isValidIsoDate', () => {
  it('accepts valid ISO dates including leap-year Feb 29', () => {
    expect(isValidIsoDate('2025-01-01')).toBe(true);
    expect(isValidIsoDate('2025-06-15')).toBe(true);
    expect(isValidIsoDate('2025-12-31')).toBe(true);
    expect(isValidIsoDate('2024-02-29')).toBe(true);
  });

  it('rejects calendar rollovers', () => {
    expect(isValidIsoDate('2025-02-30')).toBe(false);
    expect(isValidIsoDate('2025-02-29')).toBe(false);
    expect(isValidIsoDate('2025-04-31')).toBe(false);
    expect(isValidIsoDate('2025-06-31')).toBe(false);
    expect(isValidIsoDate('2025-13-01')).toBe(false);
    expect(isValidIsoDate('2025-00-10')).toBe(false);
    expect(isValidIsoDate('2025-01-00')).toBe(false);
  });

  it('rejects malformed date strings', () => {
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate('2025/06/15')).toBe(false);
    expect(isValidIsoDate('25-06-15')).toBe(false);
    expect(isValidIsoDate('2025-6-5')).toBe(false);
    expect(isValidIsoDate('not-a-date')).toBe(false);
  });
});

describe('isValidYear', () => {
  const currentYear = new Date().getFullYear();

  it('accepts years within the beekeeping range (1990 to currentYear + 1)', () => {
    expect(isValidYear('1990')).toBe(true);
    expect(isValidYear(String(currentYear))).toBe(true);
    expect(isValidYear(String(currentYear + 1))).toBe(true);
  });

  it('rejects years outside the realistic range', () => {
    expect(isValidYear('1989')).toBe(false);
    expect(isValidYear('0000')).toBe(false);
    expect(isValidYear(String(currentYear + 2))).toBe(false);
    expect(isValidYear('2099')).toBe(false);
  });

  it('rejects non-4-digit year strings', () => {
    expect(isValidYear('')).toBe(false);
    expect(isValidYear('25')).toBe(false);
    expect(isValidYear('2025a')).toBe(false);
    expect(isValidYear(' 2025')).toBe(false);
  });
});

describe('buildQueenInput', () => {
  it('rejects rollover dates and out-of-range years', () => {
    const baseDraft = {
      queenStatus: 'Bekräftad' as const,
      queenYear: '2025',
      queenMarkingColor: 'Blå' as const,
      queenOrigin: 'Egen avläggare',
      queenIntroducedAt: '2025-06-15',
      queenHistory: [],
    };

    expect(buildQueenInput({ ...baseDraft, queenIntroducedAt: '2025-02-30' }).error).toBeDefined();
    expect(buildQueenInput({ ...baseDraft, queenYear: '1989' }).error).toBeDefined();
    expect(
      buildQueenInput({
        ...baseDraft,
        queenHistory: [{ id: '1', year: '1989', note: 'Gammal' }],
      }).error,
    ).toBeDefined();
    expect(buildQueenInput(baseDraft).value).toBeDefined();
  });
});
