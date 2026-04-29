import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '@busnet/shared/components/common/ErrorBoundary';
import { ProtectedRoute } from '@busnet/shared/components/common/ProtectedRoute';
import { SearchProvider } from '@busnet/shared/context/SearchContext';
import { LanguageProvider } from '@busnet/shared/context/LanguageContext';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Toaster } from 'react-hot-toast';
 
import AgentLayout from '@busnet/shared/pages/agent/AgentLayout';
import AgentDashboard from '@busnet/shared/pages/agent/AgentDashboard';
import NewBooking from '@busnet/shared/pages/agent/NewBooking';
import MyBookings from '@busnet/shared/pages/agent/MyBookings';
import PassengerBase from '@busnet/shared/pages/agent/PassengerBase';
import CRM from '@busnet/shared/pages/agent/CRM';
import Chat from '@busnet/shared/pages/agent/Chat';
import Finance from '@busnet/shared/pages/agent/Finance';
import Refunds from '@busnet/shared/pages/agent/Refunds';
import Analytics from '@busnet/shared/pages/agent/Analytics';
import RoutesPage from '@busnet/shared/pages/agent/Routes';
import Carriers from '@busnet/shared/pages/agent/Carriers';
import Notifications from '@busnet/shared/pages/agent/Notifications';
import Profile from '@busnet/shared/pages/agent/Profile';
import Settings from '@busnet/shared/pages/agent/Settings';
import { ForumPage } from '@busnet/shared/pages';
import PortalLogin from '@busnet/shared/components/auth/PortalLogin';
import { Building2 } from 'lucide-react';
 
export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SearchProvider>
          <BrowserRouter basename="/agent">
            <Toaster position="top-right" toastOptions={{ style: { background: '#111520', color: '#fff' } }} />
            <Routes>
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/login" element={
                 <PortalLogin role="agent" title="Busnet Agent" subtitle="Касова система та керування агенціями" colorClass="bg-violet-500/20 text-violet-400 border-violet-500/30" icon={Building2} dashboardRoute="/agent/" />
              } />
              <Route path="/" element={<ProtectedRoute role="agent" loginUrl="/login"><AgentLayout /></ProtectedRoute>}>
                <Route index element={<AgentDashboard />} />
                <Route path="book" element={<NewBooking />} />
                <Route path="mybookings" element={<MyBookings />} />
                <Route path="passengers" element={<PassengerBase />} />
                <Route path="crm" element={<CRM />} />
                <Route path="chat" element={<Chat />} />
                <Route path="finance" element={<Finance />} />
                <Route path="refunds" element={<Refunds />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="routes" element={<RoutesPage />} />
                <Route path="carriers" element={<Carriers />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<AgentDashboard />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
