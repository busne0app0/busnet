import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@busnet/shared/components/common/ErrorBoundary';
import { ProtectedRoute } from '@busnet/shared/components/common/ProtectedRoute';
import { SearchProvider } from '@busnet/shared/context/SearchContext';
import { LanguageProvider } from '@busnet/shared/context/LanguageContext';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Toaster } from 'react-hot-toast';

import HomePage from '@busnet/shared/pages/HomePage';
import BookingPage from '@busnet/shared/pages/BookingPage';
import AuthPage from '@busnet/shared/pages/AuthPage';
import ForumPage from '@busnet/shared/pages/ForumPage';
import Dashboard from '@busnet/shared/pages/Dashboard';
import { DashboardBridge } from '@busnet/shared/pages/DashboardBridge';
import NewTrip from '@busnet/shared/pages/carrier/NewTrip';
import MainLayout from '@busnet/shared/components/layout/MainLayout';

export default function App() {
  const initAuth = useAuthStore(state => state.initAuth);
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SearchProvider>
          <BrowserRouter basename="/">
            <Toaster position="top-right" toastOptions={{ style: { background: '#111520', color: '#fff' } }} />
            <Routes>
              <Route element={<MainLayout><HomePage /></MainLayout>} path="/" />
              <Route element={<ForumPage />} path="/forum" />
              <Route element={<BookingPage />} path="/booking" />
              <Route element={<AuthPage />} path="/auth" />
              <Route path="/dashboard" element={<ProtectedRoute loginUrl="/auth"><Dashboard /></ProtectedRoute>} />
              <Route path="/bridge" element={<DashboardBridge />} />
              <Route path="/test-trip-form" element={<div className="min-h-screen bg-[#030712] p-8"><NewTrip /></div>} />
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
