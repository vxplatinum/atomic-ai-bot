import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { forgotPassword } from '../api/auth';
import { getApiErrorMessage } from '../utils/authErrors';

const FORGOT_PASSWORD_SUCCESS =
  'If an account exists for this email, a password reset link has been sent.';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState(FORGOT_PASSWORD_SUCCESS);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setSuccessMessage(
        typeof data?.message === 'string' ? data.message : FORGOT_PASSWORD_SUCCESS
      );
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send reset email.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center min-h-[calc(100dvh-var(--site-header-height))] -mt-8 pt-8 pb-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">Reset your password</h2>
          <p className="text-foreground-muted text-sm mt-1">
            Enter your email address and we will send you a link to reset your password.
          </p>
        </div>
      {error && <Alert>{error}</Alert>}
      {success && <Alert type="success">{successMessage}</Alert>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Button type="submit" loading={loading} loadingLabel="Sending reset link" className="w-full mt-6">
          Send reset link
        </Button>
      </form>
      <div className="mt-6 pt-4 text-center text-sm">
        <Link to="/login" className="text-brand hover:text-brand-hover transition-colors">
          Back to login
        </Link>
      </div>
      </div>
    </div>
  );
}
