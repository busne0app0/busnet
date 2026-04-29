import React, { useState, useEffect } from 'react';
import HeroSection from '@busnet/shared/components/home/HeroSection';
import SearchWidget from '@busnet/shared/components/home/SearchWidget';
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
import { useTrips } from '@busnet/shared/hooks/useTrips';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { Trip } from '../busnet/types';
import { motion, AnimatePresence } from 'framer-motion';
import { slowMotionScroll } from '@busnet/shared/lib/scrollUtils';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [showResults, setShowResults] = useState(false);
  const { trips, loading, fetchTrips } = useTrips();
  const { searchParams, triggerSearch, setTriggerSearch } = useSearch();
  const { setTrip } = useBookingStore();
  const navigate = useNavigate();

  // Listen for global search triggers (from cards, suggestions, voice)
  useEffect(() => {
    if (triggerSearch) {
      handleSearch();
      setTriggerSearch(false);
    }
  }, [triggerSearch]);

  const handleSearch = () => {
    setShowResults(true);
    fetchTrips(searchParams);
    // Slow Motion Scroll to results ( вальяжний скролл )
    setTimeout(() => {
      slowMotionScroll(250, 1200);
    }, 100);
  };

  const handleSelectTrip = (trip: Trip) => {
    setTrip(trip);
    navigate('/booking');
  };

  return (
    <div className="pb-16 min-h-screen flex flex-col relative w-full items-center bg-[#030712]">
      {/* Global Background Transitions */}
      <div className="absolute inset-0 pointer-events-none z-0">
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
              <HeroSection />
            </motion.div>
          ) : (
            <motion.div 
              key="search-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full text-center pt-32 pb-4 px-4"
            >
              <h1 className="text-3xl sm:text-4xl font-black neon-gradient-text uppercase italic tracking-tight pr-4 leading-[1.2]">РЕЗУЛЬТАТИ ПОШУКУ</h1>
              <button 
                onClick={() => setShowResults(false)}
                className="text-slate-500 hover:text-white text-sm mt-2 transition-colors flex items-center gap-2 mx-auto"
              >
                ← На головну
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <SearchWidget onSearch={handleSearch} isLoading={loading} />
        
        {showResults ? (
          <SearchResults trips={trips} loading={loading} onSelect={handleSelectTrip} />
        ) : (
          <>
            <PopularDestinations />
            <Ticker />
            <AboutSection />
            <AdvantagesSection />
            <ReviewsSection />
            <ConfidenceSection />
            <AppEcoSection />
            <NeuralWorkflow />
            <SEOFooterSection />
          </>
        )}
        
      </div>
      
    </div>
  );
}
