import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import GigList from './components/GigList';
import TaxDashboard from './components/TaxDashboard';
import './App.css';

function Navigation() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('client');
  const { user, login, logout } = useContext(AuthContext);

  return (
    <div className="nav-bar">
      {user ? (
        <div className="logged-in-bar">
          <span>Welcome, <strong>{user.email}</strong> ({user.role})</span>
          {user.role === 'freelancer' && <TaxDashboard />}
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div className="login-form">
          <input 
            type="email" 
            placeholder="Enter email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>
          <button onClick={() => login({ email, role }, 'mock-jwt-token')}>
            Log In
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <header className="app-header">
          <h1>WorkMarket Gigs</h1>
          <Navigation />
        </header>
        <hr className="hr-divider" />
        <GigList />
      </div>
    </AuthProvider>
  );
}