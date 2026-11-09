-- Migration: 20261103_carrier_verification_rls.sql
-- Ensure only active/verified carriers can create or update routes

-- Drop existing policy if any
drop policy if exists "only_verified_carriers_insert_routes" on public.routes;

create policy "only_verified_carriers_insert_routes" on public.routes
  for insert with check (
    exists (
      select 1 from public.users u 
      where u.uid = auth.uid()::text 
        and (u.status = 'active' or u.status is null or u.role = 'admin')
    )
  );

-- Also protect update
drop policy if exists "only_active_carriers_update_routes" on public.routes;

create policy "only_active_carriers_update_routes" on public.routes
  for update using (
    exists (
      select 1 from public.users u 
      where u.uid = auth.uid()::text 
        and (u.status != 'blocked' or u.role = 'admin')
    )
  );
