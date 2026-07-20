import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthProvider, AuthContext } from './hooks/useAuth';
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { OutcomeDetailsPage } from './components/reconciliation/OutcomeDetailsPage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRouter() {
  const [isLogin, setIsLogin] = useState(true);
  const token = localStorage.getItem("token");
  
  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout>
      {isLogin ? (
        <LoginForm onSwitch={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onSwitch={() => setIsLogin(true)} />
      )}
    </AuthLayout>
  );
}

function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProviderWrapper>
          <Routes>
            <Route path="/login" element={<AuthRouter />} />
            <Route path="/register" element={<AuthRouter />} />
            
            <Route path="/" element={
               localStorage.getItem("token") ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
            
            <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
            <Route path="/reconciliation" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
            <Route path="/discrepancies" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
            
            <Route path="/discrepancy/:id" element={
              <ProtectedRoute>
                <OutcomeDetailsPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProviderWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
