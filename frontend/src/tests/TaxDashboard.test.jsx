
import { calculateTax } from '../components/TaxDashboard';

describe('SARS 2026/2027 tax calculations', () => {
  test('applies no tax below the primary rebate threshold', () => {
    expect(calculateTax(99000).estimatedTax).toBe(0);
  });

  test('calculates tax correctly in the first bracket', () => {
    expect(calculateTax(100000).estimatedTax).toBe(180);
  });

  test('calculates tax correctly at the second bracket boundary', () => {
    expect(calculateTax(245100).estimatedTax).toBe(26298);
  });

  test('calculates tax correctly in the second bracket', () => {
    expect(calculateTax(300000).estimatedTax).toBe(40572);
  });

  test('uses the correct marginal rate in the highest bracket', () => {
    const result = calculateTax(2000000);

    expect(result.marginalRate).toBe(0.45);
    expect(result.estimatedTax).toBe(703149);
  });

  test('does not calculate negative tax for zero income', () => {
    expect(calculateTax(0).estimatedTax).toBe(0);
  });
});
