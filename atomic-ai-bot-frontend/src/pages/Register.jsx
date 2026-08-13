import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { register as registerApi } from '../api/auth';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (form.username.length < 5 || form.password.length < 5 || !form.email.includes('@')) {
      setError('Please check that all fields are filled in correctly.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await registerApi({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.detail?.[0]?.msg || err.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center min-h-[calc(100dvh-var(--site-header-height))] -mt-8 pt-8 pb-8">
      <div className="max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Create an account</h2>
        <p className="text-foreground-muted text-sm mt-1">Join the Atomic AI Bot community</p>
      </div>
      {error && <Alert>{error}</Alert>}
      {success ? (
        <Alert type="success">
          Registration successful! Check your email and verify your account before signing in.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            minLength={5}
            required
            autoComplete="username"
            placeholder="Pick a unique username"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={5}
            required
            placeholder="At least 5 characters"
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
            name="passwordConfirm"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange}
            minLength={5}
            required
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
          <Button type="submit" loading={loading} loadingLabel="Creating account" className="w-full mt-6">
            Register
          </Button>
        </form>
      )}
      <div className="mt-6 pt-4 text-center text-sm">
        <Link to="/login" className="text-brand hover:text-brand-hover transition-colors">
        Already have an account? Log in
        </Link>
      </div>
      </div>
    </div>
  );
}
