import { useEffect } from 'react';
import { useAuth } from '../components/AuthContext';

export default function OAuthCallback() {
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(user, token);
      } catch (e) {
        console.error('OAuth callback parse error', e);
        window.location.href = '/';
      }
    } else {
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="auth-card">
      <p className="subtitle">Signing you in with Google…</p>
    </div>
  );
}