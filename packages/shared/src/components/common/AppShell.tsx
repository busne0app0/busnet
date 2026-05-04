import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { SearchProvider } from '../../context/SearchContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { ForumPage } from '../../pages';

interface AppShellProps {
  basename: string;
  children: React.ReactNode;
}

export function AppShell({ basename, children }: AppShellProps) {
  const initAuth = useAuthStore(state => state.initAuth);
  
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initAuth]);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SearchProvider>
          <BrowserRouter basename={basename}>
            <Toaster position="top-right" toastOptions={{ style: { background: '#111520', color: '#fff' } }} />
            <Routes>
              <Route path="/forum" element={<ForumPage />} />
              {children}
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
