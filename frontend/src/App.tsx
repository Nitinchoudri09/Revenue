import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthProvider, AuthContext } from './hooks/useAuth';
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { OutcomeDetailsPage } from './components/reconciliation/OutcomeDetailsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = React.useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRouter() {
  const [isLogin, setIsLogin] = useState(true);
  const { token } = React.useContext(AuthContext);
  
  if (token) return <Navigate to="/" replace />;

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

export function App() {
  const auth = useAuthProvider();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthRouter />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <AppShell>
                  <DashboardPage />
                </AppShell>
              </ProtectedRoute>
            } />
            
            <Route path="/discrepancy/:id" element={
              <ProtectedRoute>
                <OutcomeDetailsPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
