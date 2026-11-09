import { useState, useEffect } from 'react';
import { supabase } from '../supabase/config';

export function useCarrierRating(uid?: string) {
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const fetchRating = () => {
      supabase
        .from('reviews')
        .select('rating')
        .eq('carrier_id', uid)
        .then(({ data }) => {
          const v = (data ?? []).map(x => Number(x.rating)).filter(Number.isFinite);
          setRating(
            v.length
              ? { avg: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10, count: v.length }
              : { avg: 0, count: 0 }
          );
        });
    };

    fetchRating();

    const channel = supabase
      .channel(`carrier_reviews_sub_${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `carrier_id=eq.${uid}` }, fetchRating)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid]);

  return rating;
}
