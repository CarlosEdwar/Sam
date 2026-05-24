import { describe, it, expect } from 'vitest';
import { getVal, findValue } from './excelHelpers';

describe('excelHelpers', () => {
  describe('getVal', () => {
    it('returns the value for an exact key match', () => {
      expect(getVal({ name: 'Test' }, ['name'])).toBe('Test');
    });

    it('returns the value case-insensitively', () => {
      expect(getVal({ NAME: 'Test2' }, ['name'])).toBe('Test2');
    });

    it('returns the fallback if key is missing', () => {
      expect(getVal({ other: 'Value' }, ['name'], 'Fallback')).toBe('Fallback');
    });
  });

  describe('findValue', () => {
    it('finds value using keyword substring match', () => {
      expect(findValue({ 'produto desc': 'Batata' }, ['produto', 'nome'])).toBe('Batata');
    });

    it('returns empty string if no keyword matches', () => {
      expect(findValue({ random: '123' }, ['produto', 'nome'])).toBe('');
    });
  });
});
