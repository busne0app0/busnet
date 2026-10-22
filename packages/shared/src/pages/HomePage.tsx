import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeroSection from '@busnet/shared/components/home/HeroSection';
import SearchResults from '@busnet/shared/components/home/SearchResults';
import PopularDestinations from '@busnet/shared/components/home/PopularDestinations';
import Ticker from '@busnet/shared/components/home/Ticker';
import NeuralWorkflow from '@busnet/shared/components/home/NeuralWorkflow';
import { AdvantagesSection } from '@busnet/shared/components/home/AdvantagesSection';
import { AboutSection } from '@busnet/shared/components/home/AboutSection';
import { ReviewsSection } from '@busnet/shared/components/home/ReviewsSection';
import { AppEcoSection } from '@busnet/shared/components/home/AppEcoSection';
import { ConfidenceSection } from '@busnet/shared/components/home/ConfidenceSection';
import { SEOFooterSection } from '@busnet/shared/components/home/SEOFooterSection';
import { ErrorBoundary } from '@busnet/shared/components/common/ErrorBoundary';
import { useTrips } from '@busnet/shared/hooks/useTrips';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { Trip } from '../busnet/types';
import { motion, AnimatePresence } from 'framer-motion';
import { slowMotionScroll } from '@busnet/shared/lib/scrollUtils';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function HomePage() {
  const [showResults, setShowResults] = useState(false);
  const { trips, loading, fetchTrips } = useTrips();
  const { searchParams, setSearchParams, triggerSearch, setTriggerSearch } = useSearch();
  const { setTrip } = useBookingStore();
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  const resultsRef = useRef<HTMLDivElement>(null);
  const initialSyncDone = useRef(false);

  // Sync state from URL query parameters on initial mount (items 5, 83)
  useEffect(() => {
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;

    const urlFrom = urlParams.get('from');
    const urlTo = urlParams.get('to');
    const urlDate = urlParams.get('date');

    if (urlFrom || urlTo || urlDate) {
      const restored = {
        from: urlFrom || '',
        to: urlTo || '',
        date: urlDate || new Date().toISOString().split('T')[0],
      };
      setSearchParams(restored);

      if (urlFrom && urlTo) {
        setShowResults(true);
        fetchTrips(restored);
      }
    }
  }, [urlParams, setSearchParams, fetchTrips]);

  // Execute search and sync URL parameters (items 5, 83)
  const executeSearch = useCallback((params = searchParams) => {
    setShowResults(true);
    fetchTrips(params);

    // Update URL query parameters cleanly
    const query: Record<string, string> = {};
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;
    if (params.date) query.date = params.date;
    setUrlParams(query, { replace: false });
  }, [searchParams, fetchTrips, setUrlParams]);

  // Listen for global search triggers (item 32: guard against redundant renders)
  useEffect(() => {
    if (triggerSearch) {
      setTriggerSearch(false);
      executeSearch();
    }
  }, [triggerSearch, setTriggerSearch, executeSearch]);

  // Safe smooth scroll to results when loaded without race condition (items 6, 27)
  useEffect(() => {
    if (showResults && !loading && resultsRef.current) {
      const top = resultsRef.current.getBoundingClientRect().top + window.pageYOffset - 100;
      slowMotionScroll(Math.max(0, top), 900);
    }
  }, [showResults, loading]);

  const handleBackToHome = () => {
    setShowResults(false);
    setUrlParams({}, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTrip = (trip: Trip) => {
    setTrip(trip);
    const params = new URLSearchParams({
      route: trip.routeId || trip.id,
      dir: trip.direction || 'outbound',
      from: String(trip.fromStopIdx ?? 0),
      to: String(trip.toStopIdx ?? 1),
      date: trip.startDate || trip.departureDate || ''
    });
    navigate(`/booking?${params.toString()}`);
  };

  return (
    <main role="main" className="pb-16 min-h-screen flex flex-col relative w-full items-center bg-[#030712]">
      {/* Global Background Transitions */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[10%] left-0 w-full h-[30%] bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent" />
        <div className="absolute top-[40%] left-0 w-full h-[40%] bg-gradient-to-b from-transparent via-purple-500/[0.03] to-transparent" />
        <div className="absolute top-[70%] left-0 w-full h-[30%] bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center"
            >
              <HeroSection onSearch={() => executeSearch()} isLoading={loading} />
            </motion.div>
          ) : (
            <motion.div
              key="search-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full text-center pt-28 sm:pt-32 pb-4 px-4"
            >
              <h1 className="text-3xl sm:text-4xl font-black neon-gradient-text uppercase italic tracking-tight pr-4 leading-[1.2]">
                РЕЗУЛЬТАТИ ПОШУКУ
              </h1>
              <button
                type="button"
                onClick={handleBackToHome}
                aria-label="Повернутися на головну сторінку"
                className="text-slate-400 hover:text-white text-sm mt-3 transition-colors flex items-center gap-2 mx-auto font-medium focus-visible:ring-1 focus-visible:ring-neon-cyan rounded-lg px-3 py-1"
              >
                ← На головну
              </button>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Results with ErrorBoundary or Marketing Landing Sections (item 28) */}
        {showResults ? (
          <div ref={resultsRef} className="w-full">
            <ErrorBoundary
              fallback={
                <div className="max-w-2xl mx-auto my-12 p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-center">
                  <p className="text-white font-bold text-lg mb-2">Не вдалося завантажити результати</p>
                  <p className="text-slate-400 text-sm mb-4">Виникла технічна помилка під час обробки маршрутів.</p>
                  <button
                    type="button"
                    onClick={() => executeSearch()}
                    className="px-6 py-2.5 bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-rose-600 transition-colors"
                  >
                    Спробувати знову
                  </button>
                </div>
              }
            >
              <SearchResults trips={trips} loading={loading} onSelect={handleSelectTrip} />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <PopularDestinations />
            <Ticker />
            <AboutSection />
            <AdvantagesSection />
            <ReviewsSection />
            <ConfidenceSection />
            <AppEcoSection />
            <NeuralWorkflow />
            <SEOFooterSection />
          </div>
        )}
      </div>
    </main>
  );
}
