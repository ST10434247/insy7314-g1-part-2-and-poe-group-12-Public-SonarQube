
import React, { createContext, useState, useEffect, useRef } from 'react';

export const AuthContext = createContext();

// Automatically log users out after 10 minutes of inactivity.
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  // Keep authentication data in memory rather than browser storage.
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const timerRef = useRef(null);

  const login = (userData, jwtToken) => {
    // Only accept the expected data types from the authentication response.
    if (
      !userData ||
      typeof userData !== 'object' ||
      Array.isArray(userData) ||
      typeof jwtToken !== 'string' ||
      jwtToken.trim().length === 0
    ) {
      return;
    }

    setUser(userData);
    setToken(jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    // Clear the inactivity timer when the user logs out.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!token) return;

    // Reset the inactivity timer whenever the user interacts with the application.
    const resetInactivityTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Monitor common user activity events.
    const activityEvents = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart'
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Start the timer when the authenticated session becomes active.
    resetInactivityTimer();

    // Clean up event listeners and timers when the session changes or component unmounts.
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
