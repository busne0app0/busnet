import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@busnet/shared/components/common/ProtectedRoute';
import { AppShell } from '@busnet/shared/components/common/AppShell';

import {
  AdminLayout, DashboardTab, ForumPage,
  LiveTripsTab, ApprovalsTab, ConflictsTab, CarriersTab, AgentsTab, RoutesTab,
  FinanceTab, RefundsTab, TransactionsTab, InvoicesTab,
  CRMTab, MarketingTab, SupportTab, SettingsTab, LogsTab, SecurityTab
} from '@busnet/shared/pages';
import PortalLogin from '@busnet/shared/components/auth/PortalLogin';
import { Shield } from 'lucide-react';

export default function App() {
  return (
    <AppShell basename="/admin">
      <Route path="/login" element={
        <PortalLogin
          role="admin"
          title="Busnet Admin"
          subtitle="Центральне управління системою"
          colorClass="bg-slate-500/20 text-slate-400 border-slate-500/30"
          icon={Shield}
        />
      } />
      <Route path="/" element={<ProtectedRoute role="admin" loginUrl="/login"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardTab />} />
        <Route path="livetrips" element={<LiveTripsTab />} />
        <Route path="approvals" element={<ApprovalsTab />} />
        <Route path="conflicts" element={<ConflictsTab />} />
        <Route path="carriers" element={<CarriersTab />} />
        <Route path="agents" element={<AgentsTab />} />
        <Route path="routes" element={<RoutesTab />} />
        <Route path="finance" element={<FinanceTab />} />
        <Route path="refunds" element={<RefundsTab />} />
        <Route path="transactions" element={<TransactionsTab />} />
        <Route path="invoices" element={<InvoicesTab />} />
        <Route path="crm" element={<CRMTab />} />
        <Route path="marketing" element={<MarketingTab />} />
        <Route path="support" element={<SupportTab />} />
        <Route path="settings" element={<SettingsTab />} />
        <Route path="logs" element={<LogsTab />} />
        <Route path="security" element={<SecurityTab />} />
        <Route path="*" element={<DashboardTab />} />
      </Route>
    </AppShell>
  );
}