import { describe, it, expect } from 'vitest';
import { normalizeOrderNumber, normalizeId, stewardRecord } from '../../src/utils/stewardship';

describe('Data Stewardship Utility', () => {
  it('should normalize order numbers correctly', () => {
    expect(normalizeOrderNumber('123-456')).toBe('123456');
    expect(normalizeOrderNumber('abc.789')).toBe('ABC789');
    expect(normalizeOrderNumber('verylongordernumber')).toBe('VERYLON');
    expect(normalizeOrderNumber('  spaces  ')).toBe('SPACES');
  });

  it('should normalize IDs (uppercase and trim)', () => {
    expect(normalizeId('  acwu90  ')).toBe('ACWU90');
    expect(normalizeId('Eecol Branch ')).toBe('EECOL BRANCH');
    expect(normalizeId(null)).toBe('');
    expect(normalizeId(undefined)).toBe('');
  });

  it('should steward entire records', () => {
    const record = {
      orderNumber: 'ibt-123',
      wireId: '  teck90  ',
      customerName: 'smith',
      otherField: 'KeepMe'
    };
    const stewarded = stewardRecord(record, ['orderNumber', 'wireId', 'customerName']);

    expect(stewarded.orderNumber).toBe('IBT123');
    expect(stewarded.wireId).toBe('TECK90');
    expect(stewarded.customerName).toBe('SMITH');
    expect(stewarded.otherField).toBe('KeepMe');
  });
});
