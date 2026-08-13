import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import { verifyEmail } from '../api/auth';

export default function EmailVerify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => {
        setStatus('error');
        setError('Confirmation failed. The link may have expired.');
      });
  }, [token]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(
        () =>
          navigate('/login', {
            replace: true,
            state: { message: 'Email confirmed. You can sign in now.' },
          }),
        2000
      );
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center min-h-[calc(100dvh-var(--site-header-height))] -mt-8 pt-8 pb-8">
      <div className="max-w-md mx-auto w-full text-center">
        <h2 className="text-2xl font-bold mb-6">Email confirmation</h2>
        {!token && <Alert>Invalid confirmation link.</Alert>}
        {token && status === 'pending' && <Loader />}
        {status === 'success' && <Alert type="success">Email confirmed. Redirecting to sign in...</Alert>}
        {status === 'error' && <Alert>{error}</Alert>}
      </div>
    </div>
  );
}
