import { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './index.css';

function AppInner() {
  const { user } = useAuth();
  const [page, setPage] = useState('login');

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