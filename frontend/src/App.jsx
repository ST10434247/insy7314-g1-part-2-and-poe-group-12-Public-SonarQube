import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import GigList from './components/GigList';
import TaxDashboard from './components/TaxDashboard';
import './App.css';

function Navigation() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [errorMsg, setErrorMsg] = useState('');
  const { user, login, logout } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
    // Send role along with email and password
    const payload = { email, password, role };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Authentication failed');
        return;
      }

      if (isSignUp) {
        // Automatically perform login after registering
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        
        if (loginRes.ok) {
          login({ email, role: data.user.role }, loginData.token);
        } else {
          setErrorMsg(loginData.error || 'Auto-login failed after registration.');
        }
      } else {
        // Save user details with selected role and the verified JWT token
        login({ email, role }, data.token);
      }

      // Clear password field on successful auth
      setPassword('');
    } catch (err) {
      setErrorMsg('Network error. Unable to connect to backend.');
    }
  };

  return (
    <div className="nav-bar">
      {user ? (
        <div className="logged-in-bar">
          <span>Welcome, <strong>{user.email}</strong> ({user.role})</span>
          {user.role === 'freelancer' && <TaxDashboard />}
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <input 
            type="email" 
            placeholder="Enter email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Enter password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          {/* User Type selection enabled for both Login & Sign Up */}
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>

          <button type="submit">
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
          
          <button 
            type="button" 
            className="toggle-auth-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            style={{ marginLeft: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Need to Log In?' : 'Need an Account?'}
          </button>
          
          {errorMsg && <div style={{ color: 'red', fontSize: '12px', width: '100%', marginTop: '4px' }}>{errorMsg}</div>}
        </form>
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