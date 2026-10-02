import React, { useContext, useState } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import GigList from './components/GigList';
import TaxDashboard from './components/TaxDashboard';
import BookingManagement from './components/BookingManagement';
import ClientBookings from './components/ClientBookings';
import AdminDisputes from './components/AdminDisputes';
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

    const endpoint = isSignUp
      ? '/api/auth/register'
      : '/api/auth/login';

    // Only registration needs a role.
    const payload = isSignUp
      ? { email, password, role }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || data.message || 'Authentication failed.');
        return;
      }

      if (isSignUp) {
        // Log in automatically after successful registration.
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          setErrorMsg(
            loginData.error ||
            loginData.message ||
            'Auto-login failed after registration.'
          );
          return;
        }

        login(loginData.user, loginData.token);
      } else {
        login(data.user, data.token);
      }

      setPassword('');
    } catch (err) {
      setErrorMsg('Network error. Unable to connect to backend.');
    }
  };

  return (
    <div className="nav-bar">
      {user ? (
        <div className="logged-in-bar">
          <span>
            Welcome, <strong>{user.email}</strong> ({user.role})
          </span>

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

          {isSignUp && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Account type"
            >
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          )}

          <button type="submit">
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>

          <button
            type="button"
            className="toggle-auth-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setPassword('');
              setRole('client');
            }}
            style={{
              marginLeft: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Need to Log In?' : 'Need an Account?'}
          </button>

          {errorMsg && (
            <div
              role="alert"
              style={{
                color: 'red',
                fontSize: '12px',
                width: '100%',
                marginTop: '4px'
              }}
            >
              {errorMsg}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function AppContent() {
  const { user } = useContext(AuthContext);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>WorkMarket Gigs</h1>
        <Navigation />
      </header>

      <hr className="hr-divider" />

      <GigList />

      {user?.role === 'client' && <ClientBookings />}

      {user?.role === 'freelancer' && <BookingManagement />}

      {user?.role === 'admin' && <AdminDisputes />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}