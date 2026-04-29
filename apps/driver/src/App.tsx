/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@busnet/shared/components/common/ErrorBoundary';
import { ProtectedRoute } from '@busnet/shared/components/common/ProtectedRoute';
import { SearchProvider } from '@busnet/shared/context/SearchContext';
import { LanguageProvider } from '@busnet/shared/context/LanguageContext';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Toaster } from 'react-hot-toast';
import { ForumPage } from '@busnet/shared/pages';
import PortalLogin from '@busnet/shared/components/auth/PortalLogin';
import { BusFront } from 'lucide-react';
 
import DriverLayout from '@busnet/shared/pages/driver/DriverLayout';
import DriverDashboard from '@busnet/shared/pages/driver/DriverDashboard';
 
export default function App() {
 
 
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SearchProvider>
          <BrowserRouter basename="/driver">
            <Toaster position="top-right" toastOptions={{ style: { background: '#111520', color: '#fff' } }} />
            <Routes>
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/login" element={
                 <PortalLogin role="driver" title="Busnet Driver" subtitle="Кабінет водія рейсу" colorClass="bg-blue-500/20 text-blue-400 border-blue-500/30" icon={BusFront} dashboardRoute="/driver/" />
              } />
              
              <Route path="/" element={<ProtectedRoute role="driver" loginUrl="/login"><DriverLayout /></ProtectedRoute>}>
                <Route index element={<DriverDashboard />} />
                <Route path="scan" element={<div className="p-8 text-center italic opacity-50">Сканер QR в розробці...</div>} />
                <Route path="trips" element={<div className="p-8 text-center italic opacity-50">Мої рейси в розробці...</div>} />
                <Route path="*" element={<DriverDashboard />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
