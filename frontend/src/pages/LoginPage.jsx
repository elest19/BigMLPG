import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PasswordField from '../components/PasswordField';
import Logo from '../../BigMLPG.jpg';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      showToast('Login Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const subtitle = 'Sign in to manage inventory and sales';

  return (
  <div className="min-h-screen w-full bg-white flex items-center justify-center px-4 py-6">
    <div className="w-full max-w-md">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 sm:p-8">
        <img
          src={Logo}
          alt="BigMLPG Logo"
          onError={(e) => {
            e.currentTarget.src =
              'https://placehold.co/96x96?text=BigMLPG';
          }}
          className="h-20 w-20 sm:h-24 sm:w-24 mx-auto object-contain rounded-xl border border-slate-100"
        />

        <h1 className="mt-4 text-center text-xl sm:text-2xl font-bold text-slate-800">
          BigM LPG Inventory
        </h1>

        <p className="mt-1 text-center text-sm text-slate-400">
          {subtitle}
        </p>

        {params.get('expired') === '1' && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            Your session expired at midnight. Please sign in again.
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="mt-6 space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-xs font-bold uppercase text-slate-500"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Need to reset your account? Contact your administrator.
        </p>

      </div>
    </div>
  </div>
);
}
