import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@busnet/shared/components/common/ErrorBoundary';
import { ProtectedRoute } from '@busnet/shared/components/common/ProtectedRoute';
import { SearchProvider } from '@busnet/shared/context/SearchContext';
import { LanguageProvider } from '@busnet/shared/context/LanguageContext';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Toaster } from 'react-hot-toast';

import HomePage from '@busnet/shared/pages/HomePage';
import BookingPage from '@busnet/shared/pages/BookingPage';
import AuthPage from '@busnet/shared/pages/AuthPage';
import ConnectPage from '@busnet/shared/pages/ConnectPage';
import ConnectPostPage from '@busnet/shared/pages/ConnectPostPage';
import Dashboard from '@busnet/shared/pages/Dashboard';
import { DashboardBridge } from '@busnet/shared/pages/DashboardBridge';
import CyberTerminal from '@busnet/shared/pages/CyberTerminal';
import InvitePage from '@busnet/shared/pages/InvitePage';
import MainLayout from '@busnet/shared/components/layout/MainLayout';
import { CookieBanner } from '@busnet/shared/components/common/CookieBanner';

// Окремі публічні юридичні сторінки (з прямими URL для користувачів та SEO/AI краулерів)
import TermsPage from '@busnet/shared/pages/legal/TermsPage';
import PrivacyPage from '@busnet/shared/pages/legal/PrivacyPage';
import CookiesPage from '@busnet/shared/pages/legal/CookiesPage';
import BookingTermsPage from '@busnet/shared/pages/legal/BookingTermsPage';
import RefundPolicyPage from '@busnet/shared/pages/legal/RefundPolicyPage';
import ContactsPage from '@busnet/shared/pages/legal/ContactsPage';

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
            <CookieBanner />
            <Routes>
              <Route element={<MainLayout><HomePage /></MainLayout>} path="/" />
              {/* BUSNET CONNECT — Соціальна платформа та її розділи */}
              <Route path="/connect" element={<ConnectPage />} />
              <Route path="/connect/community" element={<ConnectPage defaultTab="community" />} />
              <Route path="/connect/:tab" element={<ConnectPage />} />
              <Route path="/connect/post/:id" element={<ConnectPostPage />} />
              {/* Повний редірект зі старого /forum на новий розділ /connect/community */}
              <Route path="/forum" element={<Navigate to="/connect/community" replace />} />
              <Route path="/forum/*" element={<Navigate to="/connect/community" replace />} />
              <Route element={<BookingPage />} path="/booking" />
              <Route element={<AuthPage />} path="/auth" />
              <Route path="/dashboard" element={<ProtectedRoute loginUrl="/auth"><Dashboard /></ProtectedRoute>} />
              <Route path="/bridge" element={<DashboardBridge />} />
              <Route path="/cyber-terminal" element={<CyberTerminal />} />
              <Route path="/invite/:role/:referralId" element={<InvitePage />} />

              {/* 6 публічних юридичних сторінок */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/booking-terms" element={<BookingTermsPage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
