
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// SARS (2026). Rates of Tax for Individuals: 2027 Tax Year.
// Tax year: 1 March 2026 to 28 February 2027.
// Available: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
// Accessed: 30 October 2026.

// SARS individual income tax brackets for the 2026/2027 tax year.
const TAX_BRACKETS = [
  { limit: 245100, baseTax: 0, rate: 0.18, label: '18%' },
  { limit: 383100, baseTax: 44118, rate: 0.26, label: '26%' },
  { limit: 530200, baseTax: 79998, rate: 0.31, label: '31%' },
  { limit: 695800, baseTax: 125599, rate: 0.36, label: '36%' },
  { limit: 887000, baseTax: 185215, rate: 0.39, label: '39%' },
  { limit: 1878600, baseTax: 259783, rate: 0.41, label: '41%' },
  { limit: Infinity, baseTax: 666339, rate: 0.45, label: '45%' }
];

// SARS primary rebate for individuals under 65 for the 2026/2027 tax year.
const PRIMARY_REBATE = 17820;

// Calculate annual tax using the SARS progressive tax brackets.
// The primary rebate is deducted from the calculated tax, not income.
export const calculateTax = (income) => {
  const taxableIncome = Math.max(0, income);

  const bracket = TAX_BRACKETS.find(
    (taxBracket) => taxableIncome <= taxBracket.limit
  );

  const previousLimit = TAX_BRACKETS.indexOf(bracket) === 0
    ? 0
    : TAX_BRACKETS[TAX_BRACKETS.indexOf(bracket) - 1].limit;

  const grossTax = bracket.baseTax +
    ((taxableIncome - previousLimit) * bracket.rate);

  const estimatedTax = Math.max(0, grossTax - PRIMARY_REBATE);

  return {
    estimatedTax,
    marginalRate: bracket.rate,
    bracketLabel: bracket.label,
    taxableIncome
  };
};

export default function TaxDashboard() {
  const { token } = useContext(AuthContext);

  const [summary, setSummary] = useState({
    grossIncome: 0,
    estimatedTax: 0,
    netIncome: 0,
    marginalRate: 0,
    bracketLabel: '18%',
    taxYear: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('You must be logged in to view income.');
      return;
    }

    const fetchIncome = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/transactions/income', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch income data.');
        }

        const data = await res.json();

        // Use income received during the current SARS tax year.
        const grossIncome = Number(data.taxYearIncome) || 0;

        // Calculate estimated tax using the progressive SARS tax brackets.
        const taxCalculation = calculateTax(grossIncome);

        setSummary({
          grossIncome,
          estimatedTax: taxCalculation.estimatedTax,
          netIncome: grossIncome - taxCalculation.estimatedTax,
          marginalRate: taxCalculation.marginalRate,
          bracketLabel: taxCalculation.bracketLabel,
          taxYear: data.taxYear || '2026/2027'
        });
      } catch (err) {
        console.error('Failed to load tax data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, [token]);

  // Calculate the proportion of income represented by estimated tax.
  const taxPercentage = summary.grossIncome > 0
    ? Math.min(
      100,
      (summary.estimatedTax / summary.grossIncome) * 100
    )
    : 0;

  // Format all financial values as South African Rand.
  const formatAmount = (amount) =>
    amount.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  if (loading) {
    return <p>Loading income data...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div className="tax-dashboard">
      <h3>Freelancer Income & Tax Dashboard</h3>

      <p>
        SARS Tax Year: {summary.taxYear}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          minHeight: '90px',
          padding: '18px',
          background: '#e8f5e9',
          borderRadius: '4px'
        }}>
          <small>Gross Platform Income</small>
          <h2>{formatAmount(summary.grossIncome)}</h2>
        </div>

        <div style={{
          minHeight: '90px',
          padding: '18px',
          background: '#ffebee',
          borderRadius: '4px'
        }}>
          <small>Estimated Annual Tax</small>
          <h2 style={{ color: '#c62828' }}>
            {formatAmount(summary.estimatedTax)}
          </h2>
        </div>

        <div style={{
          minHeight: '90px',
          padding: '18px',
          background: '#e3f2fd',
          borderRadius: '4px'
        }}>
          <small>Estimated Income After Tax</small>
          <h2 style={{ color: '#1565c0' }}>
            {formatAmount(summary.netIncome)}
          </h2>
        </div>
      </div>

      <div style={{
        padding: '18px',
        background: '#f5f5f5',
        borderRadius: '4px',
        marginBottom: '24px'
      }}>
        <h4>Tax Calculation</h4>

        <p>
          <strong>Applicable marginal tax rate:</strong>{' '}
          {summary.bracketLabel}
        </p>

        <p>
          <strong>Primary rebate applied:</strong>{' '}
          {formatAmount(PRIMARY_REBATE)}
        </p>

        <p>
          <strong>Estimated effective tax rate:</strong>{' '}
          {summary.grossIncome > 0
            ? `${((summary.estimatedTax / summary.grossIncome) * 100).toFixed(2)}%`
            : '0.00%'}
        </p>

        <p>
          Tax is calculated progressively. Each portion of income
          is taxed at the rate applicable to its bracket.
        </p>
      </div>

      <h4>Income vs Estimated Tax</h4>

      <div style={{
        height: '24px',
        background: '#4caf50',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        marginTop: '8px',
        marginBottom: '8px'
      }}>
        <div
          style={{
            width: `${taxPercentage}%`,
            background: '#f44336'
          }}
          title={`Estimated tax: ${taxPercentage.toFixed(2)}%`}
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <small>
          <span style={{ color: '#f44336' }}>■</span> Estimated tax
        </small>
        <small>
          <span style={{ color: '#4caf50' }}>■</span> Income after tax
        </small>
      </div>

      <p style={{
        marginTop: '24px',
        fontSize: '0.85rem',
        color: '#666'
      }}>
        Disclaimer: This is an educational tax estimate based only
        on paid income recorded through HustleHub. It assumes the
        taxpayer qualifies for the primary rebate and is under 65.
        It does not account for other income, allowable deductions,
        additional rebates or individual tax circumstances. Actual
        taxable income and tax liability may differ. Consult SARS
        or a registered tax practitioner for an accurate assessment.
      </p>
    </div>
  );
}
