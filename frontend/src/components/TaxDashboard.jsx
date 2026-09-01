import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function TaxDashboard() {
  const { token } = useContext(AuthContext);
  const [summary, setSummary] = useState({ grossIncome: 0, estimatedTax: 0, netIncome: 0 });

  useEffect(() => {
    fetch('/api/bookings/earnings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((err) => console.error('Failed to load tax data:', err));
  }, [token]);

  // Calculate visual percentage width for tax bar
  const taxPercentage = summary.grossIncome > 0 
    ? Math.min(100, ((summary.estimatedTax / summary.grossIncome) * 100).toFixed(1)) 
    : 0;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
      <h3>Freelancer Income & Tax Estimation</h3>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
        <div style={{ flex: 1, padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
          <small>Gross Earnings</small>
          <h2>${summary.grossIncome}</h2>
        </div>
        <div style={{ flex: 1, padding: '10px', background: '#ffebee', borderRadius: '4px' }}>
          <small>Est. Tax Liability</small>
          <h2 style={{ color: '#c62828' }}>-${summary.estimatedTax}</h2>
        </div>
        <div style={{ flex: 1, padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
          <small>Net Income</small>
          <h2 style={{ color: '#1565c0' }}>${summary.netIncome}</h2>
        </div>
      </div>

      {/* Visual Bar Breakdown */}
      <small style={{ fontWeight: 'bold' }}>Income Retention vs Tax Withholding ({taxPercentage}%)</small>
      <div style={{ height: '20px', background: '#4caf50', borderRadius: '10px', overflow: 'hidden', display: 'flex', marginTop: '5px' }}>
        <div style={{ width: `${taxPercentage}%`, background: '#f44336' }} />
      </div>
    </div>
  );
}