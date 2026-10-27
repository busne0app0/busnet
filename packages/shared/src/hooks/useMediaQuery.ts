import { useState, useEffect } from 'react';

/**
 * Reactive wrapper for window.matchMedia.
 * Comma in query string acts as OR (standard CSS media query syntax).
 * Example: useMediaQuery('(max-width: 1023px), (pointer: coarse)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    const listener = () => setMatches(mq.matches);
    listener();
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
