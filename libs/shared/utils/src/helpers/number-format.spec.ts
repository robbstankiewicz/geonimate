import { formatNumber } from './number-format';

describe('formatNumber', () => {
    it('normalizes negative zero when decimals are 0', () => {
        expect(formatNumber(-1e-15, 0)).toBe('0');
        expect(formatNumber(-1e-15, 2)).toBe('0.00');
    });

    it('rounds negative halves toward zero for decimals 0', () => {
        expect(formatNumber(-0.4, 0)).toBe('0');
    });

    it('does not strip minus sign from legitimate negative values', () => {
        expect(formatNumber(-0.4, 2)).toBe('-0.40');
    });

    it('formats ordinary positives', () => {
        expect(formatNumber(0, 0)).toBe('0');
        expect(formatNumber(1.234, 2)).toBe('1.23');
    });
});
