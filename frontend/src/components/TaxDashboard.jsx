import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const TAX_RATE = 0.20; // Placeholder

export default function TaxDashboard() {
  const { token } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    grossIncome: 0,
    estimatedTax: 0,
    netIncome: 0
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
        const grossIncome = Number(data.totalIncome) || 0;
        const estimatedTax = grossIncome * TAX_RATE;

        setSummary({
          grossIncome,
          estimatedTax,
          netIncome: grossIncome - estimatedTax
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

  const taxPercentage = summary.grossIncome > 0
    ? Math.min(100, (summary.estimatedTax / summary.grossIncome) * 100)
    : 0;

  const formatAmount = (amount) =>
    amount.toLocaleString(undefined, {
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
    <div style={{
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      background: '#fff'
    }}>
      <h3>Freelancer Income & Tax Estimation</h3>

      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '15px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: 1,
          minWidth: '150px',
          padding: '10px',
          background: '#e8f5e9',
          borderRadius: '4px'
        }}>
          <small>Gross Earnings</small>
          <h2>${formatAmount(summary.grossIncome)}</h2>
        </div>

        <div style={{
          flex: 1,
          minWidth: '150px',
          padding: '10px',
          background: '#ffebee',
          borderRadius: '4px'
        }}>
          <small>Est. Tax Liability</small>
          <h2 style={{ color: '#c62828' }}>
            -${formatAmount(summary.estimatedTax)}
          </h2>
        </div>

        <div style={{
          flex: 1,
          minWidth: '150px',
          padding: '10px',
          background: '#e3f2fd',
          borderRadius: '4px'
        }}>
          <small>Net Income</small>
          <h2 style={{ color: '#1565c0' }}>
            ${formatAmount(summary.netIncome)}
          </h2>
        </div>
      </div>

      <small style={{ fontWeight: 'bold' }}>
        Income Retention vs Tax Withholding ({taxPercentage.toFixed(1)}%)
      </small>

      <div style={{
        height: '20px',
        background: '#4caf50',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        marginTop: '5px'
      }}>
        <div style={{
          width: `${taxPercentage}%`,
          background: '#f44336'
        }} />
      </div>
    </div>
  );
}