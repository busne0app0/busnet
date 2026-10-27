import { supabase } from '@busnet/shared/supabase/config';

export interface SubmitLeadParams {
  name: string;
  phone: string;
  from_city?: string;
  to_city?: string;
  date?: string | null;
}

/**
 * Submit customer lead for route finding.
 * Uses DB defaults for created_at (now()).
 * Does not silently swallow errors so callers can handle network/RLS issues gracefully.
 */
export async function submitLead(payload: SubmitLeadParams): Promise<void> {
  const cleanName = payload.name.trim();
  const cleanPhone = payload.phone.trim();

  if (!cleanName || !cleanPhone) {
    throw new Error('Name and phone are required');
  }

  const { error } = await supabase.from('leads').insert({
    name: cleanName,
    phone: cleanPhone,
    from_city: payload.from_city || '',
    to_city: payload.to_city || '',
    date: payload.date || null,
    status: 'new',
  });

  if (error) {
    console.error('[leadService] Failed to insert lead:', error);
    throw error;
  }
}
