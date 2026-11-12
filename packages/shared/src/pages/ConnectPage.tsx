import React, { useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { ConnectTab } from '../connect/components/ConnectTab';
import { useNavigate, useParams } from 'react-router-dom';
import { ConnectTabType } from '../connect/types/connect.types';

interface ConnectPageProps {
  defaultTab?: ConnectTabType;
}

export default function ConnectPage({ defaultTab }: ConnectPageProps) {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const effectiveTab = (defaultTab || (tab as ConnectTabType) || 'community') as ConnectTabType;

  useEffect(() => {
    // Document SEO
    document.title = 'BUSNET CONNECT — Соціальна платформа та спільнота мандрівників Європи';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'BUSNET CONNECT — перша українська соціальна мережа для подорожей Європою. Пошук попутників, передача посилок, оперативні черги на кордонах та відгуки про рейси.');

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://busnetua.it/connect');
  }, []);

  return (
    <MainLayout>
      <div className="pt-20 min-h-screen bg-[#070b14]">
        <ConnectTab
          defaultTab={effectiveTab}
          onNavigateToTicket={(from, to) => {
            navigate(`/booking?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
          }}
        />
      </div>
    </MainLayout>
  );
}
