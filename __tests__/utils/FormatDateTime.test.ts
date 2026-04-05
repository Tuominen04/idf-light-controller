import { formatDateTime } from '../../src/utils/FormatDateTime';

describe('formatDateTime', () => {
  describe('ISO string input (no timeString)', () => {
    test('formats a valid ISO date string', () => {
      const result = formatDateTime('2025-07-19T20:29:21.000Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    test('returns original string for invalid date', () => {
      expect(formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('firmware date + time input', () => {
    test('formats "Jul 19 2025" + "20:29:21" correctly', () => {
      const result = formatDateTime('Jul 19 2025', '20:29:21');
      expect(result).toBe('2025-07-19 20:29');
    });

    test('formats January date correctly', () => {
      const result = formatDateTime('Jan 01 2026', '00:00:00');
      expect(result).toBe('2026-01-01 00:00');
    });

    test('formats December date correctly', () => {
      const result = formatDateTime('Dec 25 2025', '12:30:45');
      expect(result).toBe('2025-12-25 12:30');
    });

    test('falls back to raw string for unknown month', () => {
      const result = formatDateTime('Xyz 19 2025', '20:29:21');
      // Unknown month defaults to '01', still produces valid date
      expect(result).toBe('2025-01-19 20:29');
    });

    test('returns raw concatenation for completely invalid firmware date', () => {
      const result = formatDateTime('garbage', 'also-garbage');
      expect(result).toBe('garbage also-garbage');
    });
  });
});
