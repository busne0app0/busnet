import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@busnet/shared/components/common/ErrorBoundary';
import { ProtectedRoute } from '@busnet/shared/components/common/ProtectedRoute';
import { SearchProvider } from '@busnet/shared/context/SearchContext';
import { LanguageProvider } from '@busnet/shared/context/LanguageContext';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Toaster } from 'react-hot-toast';
 
import CarrierLayout from '@busnet/shared/pages/carrier/CarrierLayout';
import CarrierDashboard from '@busnet/shared/pages/carrier/CarrierDashboard';
import LiveTrips from '@busnet/shared/pages/carrier/LiveTrips';
import Schedule from '@busnet/shared/pages/carrier/Schedule';
import NewTrip from '@busnet/shared/pages/carrier/NewTrip';
import CRMTab from '@busnet/shared/pages/carrier/CRMTab';
import BookingsTab from '@busnet/shared/pages/carrier/BookingsTab';
import FinanceTab from '@busnet/shared/pages/carrier/FinanceTab';
import RefundsTab from '@busnet/shared/pages/carrier/RefundsTab';
import InvoicesTab from '@busnet/shared/pages/carrier/InvoicesTab';
import AnalyticsTab from '@busnet/shared/pages/carrier/AnalyticsTab';
import ReviewsTab from '@busnet/shared/pages/carrier/ReviewsTab';
import AgentsTab from '@busnet/shared/pages/carrier/AgentsTab';
import Fleet from '@busnet/shared/pages/carrier/Fleet';
import Drivers from '@busnet/shared/pages/carrier/Drivers';
import SupportTab from '@busnet/shared/pages/carrier/SupportTab';
import NotificationsTab from '@busnet/shared/pages/carrier/NotificationsTab';
import ProfileTab from '@busnet/shared/pages/carrier/ProfileTab';
import DocsTab from '@busnet/shared/pages/carrier/DocsTab';
import SettingsTab from '@busnet/shared/pages/carrier/SettingsTab';
import { ForumPage } from '@busnet/shared/pages';
import PortalLogin from '@busnet/shared/components/auth/PortalLogin';
import { Briefcase } from 'lucide-react';
 
export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SearchProvider>
          <BrowserRouter basename="/carrier">
            <Toaster position="top-right" toastOptions={{ style: { background: '#111520', color: '#fff' } }} />
            <Routes>
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/login" element={
                 <PortalLogin role="carrier" title="BUSNET CRM" subtitle="Екосистема розвитку вашого автопарку" colorClass="bg-orange-500/20 text-orange-400 border-orange-500/30" icon={Briefcase} dashboardRoute="/carrier/" />
              } />
              <Route path="/" element={<ProtectedRoute role="carrier" loginUrl="/login"><CarrierLayout /></ProtectedRoute>}>
                <Route index element={<CarrierDashboard />} />
                <Route path="livetrips" element={<LiveTrips />} />
                <Route path="trips" element={<Schedule />} />
                <Route path="newtrip" element={<NewTrip />} />
                <Route path="passengers" element={<CRMTab />} />
                <Route path="bookings" element={<BookingsTab />} />
                <Route path="finance" element={<FinanceTab />} />
                <Route path="refunds" element={<RefundsTab />} />
                <Route path="invoices" element={<InvoicesTab />} />
                <Route path="analytics" element={<AnalyticsTab />} />
                <Route path="reviews" element={<ReviewsTab />} />
                <Route path="agents" element={<AgentsTab />} />
                <Route path="buses" element={<Fleet />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="support" element={<SupportTab />} />
                <Route path="notifications" element={<NotificationsTab />} />
                <Route path="profile" element={<ProfileTab />} />
                <Route path="docs" element={<DocsTab />} />
                <Route path="settings" element={<SettingsTab />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
