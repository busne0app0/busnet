import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@busnet/shared/components/common/ProtectedRoute';
import { AppShell } from '@busnet/shared/components/common/AppShell';
import PortalLogin from '@busnet/shared/components/auth/PortalLogin';
import { BusFront } from 'lucide-react';

import DriverLayout from '@busnet/shared/pages/driver/DriverLayout';
import DriverDashboard from '@busnet/shared/pages/driver/DriverDashboard';

export default function App() {
  return (
    <AppShell basename="/driver">
      <Route path="/login" element={
        <PortalLogin
          role="driver"
          title="Busnet Driver"
          subtitle="Кабінет водія рейсу"
          colorClass="bg-blue-500/20 text-blue-400 border-blue-500/30"
          icon={BusFront}
        />
      } />
      <Route path="/" element={<ProtectedRoute role="driver" loginUrl="/login"><DriverLayout /></ProtectedRoute>}>
        <Route index element={<DriverDashboard />} />
        <Route path="scan" element={<div className="p-8 text-center italic opacity-50">Сканер QR в розробці...</div>} />
        <Route path="trips" element={<div className="p-8 text-center italic opacity-50">Мої рейси в розробці...</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </AppShell>
  );
}
