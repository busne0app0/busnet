import { supabase } from '../supabase/config';
import { RouteTemplate, Trip } from '../busnet/types';

export const busnetService = {
  // ============================================================
  // ROUTE TEMPLATES (Шаблони маршрутів)
  // ============================================================
  async saveRouteTemplate(data: Partial<RouteTemplate>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const carrierId = user?.id;
    if (!carrierId) throw new Error('Потрібна авторизація');

    // Таблиця 'routes' за реальною схемою використовує snake_case для carrier_id
    const payload: any = {
      name: (data as any).name || '',
      carrier_id: carrierId,
      seats: data.seats || 50,
      currency: data.currency || 'EUR',
      status: data.status || 'pending',
      outbound: (data as any).outbound || { stops: data.stopsThere || [], days: [] },
      inbound: (data as any).inbound || { stops: data.stopsBack || [], days: [] },
    };

    try {
      if (data.id) {
        const { error } = await supabase
          .from('routes')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        return data.id!;
      } else {
        const { data: inserted, error } = await supabase
          .from('routes')
          .insert(payload)
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
        .eq('carrier_id', carrierId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const parseField = (field: any) => {
        if (typeof field === 'string') {
          try { return JSON.parse(field); } 
          catch { return field; }
        }
        return field ?? [];
      };

      return (data || []).map(route => ({
        ...route,
        carrierId: route.carrier_id, // мапінг для UI
        outbound: parseField(route.outbound),
        inbound: parseField(route.inbound),
        amenities: parseField(route.amenities),
        rules: parseField(route.rules),
        discounts: parseField(route.discounts),
        custom_discounts: parseField(route.custom_discounts),
        custom_rules: parseField(route.custom_rules),
      }));
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
        .eq('carrier_id', user.id);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting route template:', error);
      throw error;
    }
  },

  async getAllRouteTemplates(): Promise<RouteTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const parseField = (field: any) => {
        if (typeof field === 'string') {
          try { return JSON.parse(field); } 
          catch { return field; }
        }
        return field ?? [];
      };

      return (data || []).map(route => ({
        ...route,
        carrierId: route.carrier_id,
        outbound: parseField(route.outbound),
        inbound: parseField(route.inbound),
        amenities: parseField(route.amenities),
        rules: parseField(route.rules),
        discounts: parseField(route.discounts),
        custom_discounts: parseField(route.custom_discounts),
        custom_rules: parseField(route.custom_rules),
      }));
    } catch (error: any) {
      console.error('Error fetching all route templates:', error);
      return [];
    }
  },

  // ============================================================
  // TRIPS (Конкретні рейси на дату)
  // ============================================================
  async saveTrip(data: Partial<Trip>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const carrierId = user?.id;
    if (!carrierId) throw new Error('Потрібна авторизація');

    // Таблиця 'trips' використовує carrier_id (snake) та camelCase для іншого
    const payload = {
      ...data,
      carrier_id: carrierId,
    };

    try {
      if (data.id) {
        const { error } = await supabase
          .from('trips')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        return data.id!;
      } else {
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
        .eq('carrier_id', carrierId)
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
        .eq('carrier_id', user.id);
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

    const dayMap: Record<string, number> = { 'НД': 0, 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
    const outbound = (template as any).outbound || {};
    const outboundStops: any[] = outbound.stops || template.stopsThere || [];
    const outboundDays: string[] = outbound.days || [];

    let activeDays: number[] = template.activeDays || [];
    if (activeDays.length === 0 && outboundDays.length > 0) {
      activeDays = outboundDays.map(d => dayMap[d]).filter(d => d !== undefined);
    }

    const carrierId = (template as any).carrier_id || template.carrierId;
    const departureCity = outboundStops[0]?.city || '';
    const arrivalCity = outboundStops[outboundStops.length - 1]?.city || '';
    const departureTime = outboundStops[0]?.time || '';
    const arrivalTime = outboundStops[outboundStops.length - 1]?.time || '';

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dayOfWeek = date.getDay();

      if (activeDays.includes(dayOfWeek)) {
        const dateStr = date.toISOString().split('T')[0];

        const { data: existing, error: checkError } = await supabase
          .from('trips')
          .select('id')
          .eq('carrier_id', carrierId)
          .eq('departureDate', dateStr)
          .eq('routeId', template.id)
          .limit(1);

        if (checkError) throw checkError;

        if (!existing || existing.length === 0) {
          const { error } = await supabase
            .from('trips')
            .insert({
              carrier_id: carrierId,
              routeId: template.id,
              departureCity: departureCity,
              arrivalCity: arrivalCity,
              departureDate: dateStr,
              price: template.singlePrice || 0,
              status: 'active',
              seatsBooked: 0,
              seatsTotal: template.seats || 50,
              stops: outboundStops,
              departureTime: departureTime,
              arrivalTime: arrivalTime,
            });
          if (error) throw error;
        }
      }
    }
  }
};
