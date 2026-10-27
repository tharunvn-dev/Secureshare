import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Layouts
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages (Screens 1 - 7, 17, 24)
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { VerifyEmailPage } from './pages/public/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';
import { SharedLinkViewPage } from './pages/public/SharedLinkViewPage';
import { AccessDeniedPage } from './pages/public/AccessDeniedPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

// User Portal Pages (Screens 8 - 16)
import { UserDashboard } from './pages/user/UserDashboard';
import { UserFiles } from './pages/user/UserFiles';
import { UserUpload } from './pages/user/UserUpload';
import { SharedWithMe } from './pages/user/SharedWithMe';
import { MyShares } from './pages/user/MyShares';
import { UserNotifications } from './pages/user/UserNotifications';
import { UserSecurity } from './pages/user/UserSecurity';
import { UserProfile } from './pages/user/UserProfile';

// Admin Portal Pages (Screens 17 - 23)
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminFiles } from './pages/admin/AdminFiles';
import { AdminShares } from './pages/admin/AdminShares';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminHealth } from './pages/admin/AdminHealth';
import { AdminSettings } from './pages/admin/AdminSettings';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
          {/* Public & Auth Routes (Screens 1 - 7, 17, 24) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/share/:token" element={<SharedLinkViewPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/403" element={<AccessDeniedPage />} />

          {/* Normal User Portal Pages (/app/*) (Screens 8 - 16) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="files" element={<UserFiles />} />
            <Route path="upload" element={<UserUpload />} />
            <Route path="shared-with-me" element={<SharedWithMe />} />
            <Route path="my-shares" element={<MyShares />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="security" element={<UserSecurity />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* System Administrator Portal Pages (/admin/*) (Screens 17 - 23) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="files" element={<AdminFiles />} />
            <Route path="shares" element={<AdminShares />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="health" element={<AdminHealth />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Screen 24 Fallback: Page Not Found (404) */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
  );
};

export default App;
