import { supabase } from '../supabase/config';
import { RouteTemplate, Trip } from '../busnet/types';

export const busnetService = {
  // ============================================================
  // ROUTE TEMPLATES
  // ============================================================
  async saveRouteTemplate(data: Partial<RouteTemplate>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const carrierId = user?.id;
    if (!carrierId) throw new Error('Потрібна авторизація');

    const payload = {
      ...data,
      carrierId: carrierId,
      updatedAt: Date.now(),
      createdAt: data.createdAt || Date.now(),
    };

    try {
      if (data.id) {
        // ✅ UPDATE — id вже є, просто оновлюємо
        const { error } = await supabase
          .from('routes')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        return data.id!;
      } else {
        // ✅ INSERT — прибираємо id, Postgres генерує UUID сам
        const { id: _omit, ...payloadWithoutId } = payload as any;
        const { data: inserted, error } = await supabase
          .from('routes')
          .insert(payloadWithoutId)
          .select('id')
          .single();
        if (error) throw error;
        return inserted.id;
      }
    } catch (error: any) {
      console.error('Error saving route template:', error);
      throw error;
    }
  },

  async getMyRouteTemplates(): Promise<RouteTemplate[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const carrierId = user?.id;
    if (!carrierId) return [];

    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('carrierId', carrierId)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching route templates:', error);
      return [];
    }
  },

  async deleteRouteTemplate(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Потрібна авторизація');

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id)
        .eq('carrierId', user.id);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting route template:', error);
      throw error;
    }
  },

  // Admin: Get all templates
  async getAllRouteTemplates(): Promise<RouteTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all route templates:', error);
      return [];
    }
  },

  // ============================================================
  // TRIPS
  // ============================================================
  async saveTrip(data: Partial<Trip>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const carrierId = user?.id;
    if (!carrierId) throw new Error('Потрібна авторизація');

    const payload = {
      ...data,
      carrierId: carrierId,
    };

    try {
      if (data.id) {
        // ✅ UPDATE — id вже є
        const { error } = await supabase
          .from('trips')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        return data.id!;
      } else {
        // ✅ INSERT — прибираємо id, Postgres генерує UUID сам
        const { id: _omit, ...payloadWithoutId } = payload as any;
        const { data: inserted, error } = await supabase
          .from('trips')
          .insert(payloadWithoutId)
          .select('id')
          .single();
        if (error) throw error;
        return inserted.id;
      }
    } catch (error: any) {
      console.error('Error saving trip:', error);
      throw error;
    }
  },

  async getMyTrips(): Promise<Trip[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const carrierId = user?.id;
    if (!carrierId) return [];

    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('carrierId', carrierId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      return [];
    }
  },

  async deleteTrip(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Потрібна авторизація');

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('carrierId', user.id);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  },

  // ============================================================
  // GENERATE TRIPS FROM TEMPLATE
  // ============================================================
  async generateTripsFromTemplate(template: RouteTemplate, daysAhead = 30): Promise<void> {
    const now = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dayOfWeek = date.getDay(); // 0-6

      if (template.activeDays.includes(dayOfWeek)) {
        const dateStr = date.toISOString().split('T')[0];

        // Перевіряємо чи рейс вже існує
        const { data: existing, error: checkError } = await supabase
          .from('trips')
          .select('id')
          .eq('carrierId', template.carrierId)
          .eq('departureDate', dateStr)
          .eq('routeId', template.id)
          .limit(1);

        if (checkError) throw checkError;

        if (!existing || existing.length === 0) {
          // ✅ INSERT без id — Postgres генерує UUID сам
          const { error } = await supabase
            .from('trips')
            .insert({
              carrierId: template.carrierId,
              routeId: template.id,
              departureCity: template.stopsThere[0]?.city || '',
              arrivalCity: template.stopsThere[template.stopsThere.length - 1]?.city || '',
              departureDate: dateStr,
              price: template.singlePrice || 0,
              status: 'active',
              seatsBooked: 0,
              seatsTotal: template.seats,
              stops: template.stopsThere,
              departureTime: template.stopsThere[0]?.time || '',
              arrivalTime: template.stopsThere[template.stopsThere.length - 1]?.time || '',
            });
          if (error) throw error;
        }
      }
    }
  }
};

