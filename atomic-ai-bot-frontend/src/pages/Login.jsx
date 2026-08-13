import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { login as loginApi } from '../api/auth';
import { getLoginErrorMessage } from '../utils/authErrors';
import { consumeSessionNotice } from '../utils/authSession';
import Loader from '../components/Loader';
import useAuth from '../hooks/useAuth';
import { getAccessToken, setTokens } from '../utils/token';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, refreshUser } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && getAccessToken()) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const sessionNotice = consumeSessionNotice();
    if (sessionNotice) {
      setNotice(sessionNotice);
      return;
    }
    if (location.state?.message) {
      setNotice(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.username || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const data = await loginApi({ username: form.username.trim(), password: form.password });
      setTokens(data);
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <Loader />;
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center min-h-[calc(100dvh-var(--site-header-height))] -mt-8 pt-8 pb-8">
      <div className="max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Login to your account</h2>
        <p className="text-foreground-muted text-sm mt-1">Welcome back</p>
      </div>
      {notice && <Alert type="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Email or username"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
          autoComplete="username"
          placeholder="you@example.com or username"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          placeholder="Enter your password"
        />
        <Button type="submit" loading={loading} loadingLabel="Signing in" className="w-full mt-6">
          Login
        </Button>
      </form>
      <div className="mt-6 pt-4 flex flex-col gap-2 text-sm text-center">
        <Link to="/register" className="text-brand hover:text-brand-hover transition-colors">
        Don't have an account? Register
        </Link>
        <Link to="/forgot-password" className="text-brand hover:text-brand-hover transition-colors">
        Reset password
        </Link>
      </div>
      </div>
    </div>
  );
}
