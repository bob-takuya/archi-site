import {
  formatYear,
  formatDateRange,
  formatArchitectNameWithLifespan,
  formatLocation,
  formatTags,
  truncateText,
  formatNumber,
  sanitizeHtml
} from '../../../src/utils/formatters';

describe('Formatter Utilities', () => {
  describe('formatYear', () => {
    test('formats valid year', () => {
      expect(formatYear(2023)).toBe('2023');
    });

    test('returns default text for null or undefined year', () => {
      expect(formatYear(null)).toBe('不明');
      expect(formatYear(undefined)).toBe('不明');
    });

    test('uses custom unknown text when provided', () => {
      expect(formatYear(null, 'Unknown')).toBe('Unknown');
    });
  });

  describe('formatDateRange', () => {
    test('formats start and end years', () => {
      expect(formatDateRange(1980, 2020)).toBe('1980 - 2020');
    });

    test('handles missing end year', () => {
      expect(formatDateRange(1980)).toBe('1980');
    });

    test('handles missing start year', () => {
      expect(formatDateRange(undefined, 2020)).toBe('不明');
    });

    test('uses custom unknown text', () => {
      expect(formatDateRange(null, null, 'Unknown')).toBe('Unknown');
    });
  });

  describe('formatArchitectNameWithLifespan', () => {
    test('formats name with birth and death years', () => {
      expect(formatArchitectNameWithLifespan('Frank Lloyd Wright', 1867, 1959)).toBe('Frank Lloyd Wright (1867 - 1959)');
    });

    test('formats name with only birth year', () => {
      expect(formatArchitectNameWithLifespan('Tadao Ando', 1941)).toBe('Tadao Ando (1941)');
    });

    test('returns only name when no years provided', () => {
      expect(formatArchitectNameWithLifespan('Zaha Hadid')).toBe('Zaha Hadid');
    });
  });

  describe('formatLocation', () => {
    test('removes postal code', () => {
      expect(formatLocation('〒100-0001 東京都千代田区')).toBe('東京都千代田区');
    });

    test('removes numeric address prefix', () => {
      expect(formatLocation('1-2-3 東京都千代田区')).toBe('東京都千代田区');
    });

    test('returns empty string for null or undefined', () => {
      expect(formatLocation(null)).toBe('');
      expect(formatLocation(undefined)).toBe('');
    });
  });

  describe('formatTags', () => {
    test('splits comma-separated tags', () => {
      expect(formatTags('modern,concrete,minimalist')).toEqual(['modern', 'concrete', 'minimalist']);
    });

    test('removes tags with "の追加建築"', () => {
      expect(formatTags('modern,concrete,建物Aの追加建築,minimalist')).toEqual(['modern', 'concrete', 'minimalist']);
    });

    test('returns empty array for null or undefined', () => {
      expect(formatTags(null)).toEqual([]);
      expect(formatTags(undefined)).toEqual([]);
    });
  });

  describe('truncateText', () => {
    test('truncates text longer than maxLength', () => {
      const longText = 'This is a very long description that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long d...');
    });

    test('does not truncate text shorter than maxLength', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe(shortText);
    });

    test('returns empty string for null or undefined', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
    });
  });

  describe('formatNumber', () => {
    test('formats number with thousands separators', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    test('formats number with specified locale', () => {
      expect(formatNumber(1000000, 'de-DE')).toBe('1.000.000');
    });

    test('returns empty string for null or undefined', () => {
      expect(formatNumber(null)).toBe('');
      expect(formatNumber(undefined)).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    test('escapes HTML special characters', () => {
      expect(sanitizeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    test('returns empty string for null or undefined', () => {
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });
  });
});