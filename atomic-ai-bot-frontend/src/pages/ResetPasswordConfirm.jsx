import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { resetPasswordConfirm } from '../api/auth';
import { getApiErrorMessage } from '../utils/authErrors';
import { clearTokens } from '../utils/token';

export default function ResetPasswordConfirm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      setError('Invalid password reset link.');
      return;
    }

    if (password.length < 5) {
      setError('Password must be at least 5 characters.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordConfirm({ token, new_password: password });
      clearTokens();
      setSuccess(true);
      setTimeout(
        () =>
          navigate('/login', {
            replace: true,
            state: { message: 'Password updated. Please sign in with your new password.' },
          }),
        1500
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update password.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center min-h-[calc(100dvh-var(--site-header-height))] -mt-8 pt-8 pb-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">Reset your password</h2>
          <p className="text-foreground-muted text-sm mt-1">Enter your new password and confirm it. </p>
        </div>
        {!token && <Alert>Invalid password reset link.</Alert>}
        {error && <Alert>{error}</Alert>}
        {success && <Alert type="success">Password updated. Redirecting to sign in...</Alert>}
        {token && !success && (
          <form onSubmit={handleSubmit}>
            <Input
              label="New password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={5}
              required
              placeholder="At least 5 characters"
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              name="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={5}
              required
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading} loadingLabel="Saving password" className="w-full mt-6">
              Save password
            </Button>
          </form>
        )}
        <div className="mt-6 pt-4 text-center text-sm">
          <Link to="/login" className="text-brand hover:text-brand-hover transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
