import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './index.css';

function AppInner() {
  const { user, login } = useAuth();
  const [page, setPage] = useState('login');

  useEffect(() => {
    // Handle OAuth callback — token is in the URL query string
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        login(userData, token);
        // Clean up URL
        window.history.replaceState({}, document.title, '/');
      } catch (e) {
        console.error('OAuth callback error', e);
      }
    }
  }, []);

  if (user) return <Dashboard />;

  return page === 'login'
    ? <Login onSwitch={() => setPage('register')} />
    : <Register onSwitch={() => setPage('login')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}