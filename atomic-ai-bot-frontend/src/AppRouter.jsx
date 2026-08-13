import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerify from './pages/EmailVerify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import Dashboard from './pages/Dashboard';
import BotCreate from './pages/BotCreate';
import BotEdit from './pages/BotEdit';
import BotDetails from './pages/BotDetails';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminBotDetail from './pages/admin/AdminBotDetail';
import NotFound from './pages/NotFound';
import Loader from './components/Loader';
import Layout from './components/Layout';
import useAuth from './hooks/useAuth';
import { getAccessToken } from './utils/token';

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const hasToken = !!getAccessToken();

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const hasToken = !!getAccessToken();

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailVerify />} />
          <Route path="/auth/verify-email" element={<EmailVerify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password-confirm" element={<ResetPasswordConfirm />} />
          <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/bot/create" element={<ProtectedRoute><BotCreate /></ProtectedRoute>} />
          <Route path="/bot/:id/edit" element={<ProtectedRoute><BotEdit /></ProtectedRoute>} />
          <Route path="/bot/:id" element={<ProtectedRoute><BotDetails /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="bots/:botId" element={<AdminBotDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
