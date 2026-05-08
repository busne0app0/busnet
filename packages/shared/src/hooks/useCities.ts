import { useState, useEffect } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { cities as staticCities, City } from '@busnet/shared/data/cities';

export function useCities() {
  const [dbCities, setDbCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDbCities = async () => {
      setLoading(true);
      try {
        const { data: routes, error } = await supabase
          .from('routes')
          .select('outbound, inbound')
          .eq('status', 'active');

        if (error) throw error;

        const citySet = new Set<string>();
        routes?.forEach(route => {
          const stops = [
            ...(route.outbound?.stops || []),
            ...(route.inbound?.stops || [])
          ];
          stops.forEach((s: any) => {
            if (s.city) citySet.add(s.city.trim());
          });
        });

        // Конвертуємо назви з БД у формат City
        const fromDb: City[] = Array.from(citySet).map(cityName => {
          const existing = staticCities.find(c => 
            c.names.uk.toLowerCase() === cityName.toLowerCase() ||
            c.names.en.toLowerCase() === cityName.toLowerCase()
          );

          if (existing) return { ...existing, fromDb: true };

          return {
            id: `db-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
            names: { uk: cityName, en: cityName, it: cityName },
            countryCode: '??',
            popular: false,
            fromDb: true
          };
        });

        // Мерджимо зі статичними містами
        const merged = [...fromDb];
        staticCities.forEach(sc => {
          if (!merged.find(c => c.names.uk === sc.names.uk)) {
            merged.push({ ...sc, fromDb: false });
          }
        });

        setDbCities(merged);
      } catch (e) {
        console.error("[useCities] Помилка завантаження міст:", e);
        // У разі помилки показуємо хоча б статику
        setDbCities(staticCities.map(c => ({ ...c, fromDb: false })));
      } finally {
        setLoading(false);
      }
    };

    fetchDbCities();
  }, []);

  return { dbCities, loading };
}

// Розширюємо тип City для внутрішнього використання (опціонально)
export interface ExtendedCity extends City {
  fromDb?: boolean;
}
