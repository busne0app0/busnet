import React, { useEffect, useRef } from 'react';

/**
 * CyberTerminal - MISSION CONTROL TERMINAL
 * (Converted from standalone HTML/JS)
 */
export default function CyberTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject the script logic once the component is mounted
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // DATA STORE
        const DAYS_UA = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
        const MONTHS_UA = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
        const AM_LABELS = { wifi: 'Wi-Fi', wc: 'WC', ac: 'A/C', power: '220V', audio: 'Audio', food: 'Їжа' };
        const AM_ICONS = { wifi: '📶', wc: '🚻', ac: '❄', power: '⚡', audio: '🎧', food: '🥪' };

        let DB = { carriers: [], routes: [], stops: {}, tickets: [] };
        let supaConfig = { url: '', key: '' };
        let currentCarrierId = null;
        let currentRouteId = null;

        function saveDB() {
          try { localStorage.setItem('cdt_db', JSON.stringify(DB)); } catch (e) {}
        }

        function loadDB() {
          try {
            const s = localStorage.getItem('cdt_db');
            if (s) DB = Object.assign({ carriers: [], routes: [], stops: {}, tickets: [] }, JSON.parse(s));
          } catch (e) {}
        }

        function seedData() {
          if (DB.carriers.length) return;
          DB.carriers.push({
            id: 'c1', name: 'BUS TRANSFER UA-IT', code: 'BTIT',
            color: '#00f2ff', phone: '+380 67 000 0000', email: 'info@busua-it.com', notes: 'Міжнародні перевезення UA↔IT'
          });
          DB.routes.push({
            id: 'r1', carrierId: 'c1',
            name: 'Одеса — Салерно', departureDays: [1, 4, 6], amenities: ['wifi', 'wc', 'ac', 'power']
          });
          DB.stops['r1'] = [
            { id: 's01', cityUA: 'Одеса', cityIT: 'Odessa', addr: 'Центральний автовокзал', dep: '20:00', arr: null, dayOffset: 0, sortOrder: 0 },
            { id: 's02', cityUA: 'Київ', cityIT: 'Kiev', addr: 'АС Київ', dep: '22:30', arr: '22:30', dayOffset: 0, sortOrder: 1 },
            { id: 's29', cityUA: 'Салерно', cityIT: 'Salerno', addr: 'Piazza Concordia', dep: null, arr: '19:50', dayOffset: 2, sortOrder: 28 },
          ];
          saveDB();
        }

        // --- UI LOGIC ---
        window.notify = (msg, type = 'ok') => {
          const el = document.getElementById('notif');
          if(!el) return;
          el.textContent = msg;
          el.className = 'notif notif-' + type;
          void el.offsetWidth;
          el.classList.add('show');
          setTimeout(() => el.classList.remove('show'), 3200);
        };

        window.goTab = (name, btn) => {
          document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          document.getElementById('tab-' + name).classList.add('active');
          if(btn) btn.classList.add('active');
          if (name === 'carriers') renderCarriersList();
          if (name === 'routes') renderRoutesList();
        };

        function renderCarriersList() {
          const el = document.getElementById('carriers-list');
          if(!el) return;
          el.innerHTML = DB.carriers.map(c => \`
            <div class="carrier-card" onclick="window.notify('Ви обрали ' + '\${c.name}')">
              <div class="carrier-logo" style="background:\${c.color}20;border:1px solid \${c.color}40;color:\${c.color}">\${c.code}</div>
              <div class="carrier-info">
                <div class="carrier-name">\${c.name}</div>
                <div class="carrier-meta">\${c.phone}</div>
              </div>
            </div>
          \`).join('');
        }

        function renderRoutesList() {
           const el = document.getElementById('routes-list');
           if(!el) return;
           el.innerHTML = DB.routes.map(r => \`
            <div class="route-card">
              <div class="route-title">\${r.name}</div>
              <div class="route-sub">Маршрут ID: \${r.id}</div>
            </div>
          \`).join('');
        }

        // Init
        loadDB();
        seedData();
        setInterval(() => { 
          const clock = document.getElementById('clock');
          if(clock) clock.textContent = new Date().toLocaleTimeString('uk-UA'); 
        }, 1000);
        
        // Expose to window for inline onclicks
        window.openModal = (id) => document.getElementById(id).classList.add('open');
        window.closeModal = (id) => document.getElementById(id).classList.remove('open');

      })();
    \`;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <div className="cyber-terminal-root" ref={terminalRef}>
      <style>{`
        .cyber-terminal-root {
          --bg:#050505; --bg2:#080810; --bg3:#0d0d18;
          --cyan:#00f2ff; --pink:#ff00ff; --green:#39ff14; --amber:#ffb800; --red:#ff3366;
          --border:rgba(0,242,255,0.18); --text:#d0e8f8; --text-muted:#4a6880;
          --font-hd:'Orbitron', sans-serif; --font-mono:'JetBrains Mono', monospace;
          background: var(--bg); color: var(--text); font-family: var(--font-mono); min-height: 100vh;
          position: fixed; inset: 0; z-index: 9999; overflow-y: auto;
        }
        .notif { position:fixed; top:80px; right:24px; padding:11px 18px; border-radius:6px; font-size:11px; z-index:10000; transform:translateX(220px); opacity:0; transition:all .35s; }
        .notif.show { transform:translateX(0); opacity:1; }
        .notif-ok { background:rgba(57,255,20,0.12); border:1px solid var(--green); color:var(--green); }
        .header { padding:14px 28px; border-bottom:1px solid var(--border); background:rgba(5,5,5,0.95); backdrop-filter:blur(20px); display:flex; align-items:center; justify-content:space-between; }
        .logo { font-family:var(--font-hd); font-size:17px; font-weight:900; color:var(--cyan); letter-spacing:4px; text-shadow:0 0 24px rgba(0,242,255,0.6); }
        .nav { display:flex; border-bottom:1px solid var(--border); background:rgba(5,5,5,0.9); padding:0 28px; }
        .nav-tab { padding:12px 22px; font-family:var(--font-hd); font-size:10px; color:var(--text-muted); cursor:pointer; border-bottom:2px solid transparent; }
        .nav-tab.active { color:var(--cyan); border-bottom-color:var(--cyan); }
        .page { padding:28px; }
        .sec-title { font-family:var(--font-hd); font-size:9px; letter-spacing:4px; color:var(--pink); margin-bottom:16px; border-bottom:1px solid rgba(255,0,255,0.2); text-transform:uppercase; display:flex; align-items:center; gap:10px; }
        .card { background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:6px; padding:18px; margin-bottom:16px; }
        .carrier-card, .route-card { background:rgba(255,255,255,0.02); border:1px solid var(--border); padding:14px; margin-bottom:10px; cursor:pointer; }
        .carrier-name, .route-title { font-family:var(--font-hd); font-size:12px; color:var(--cyan); }
        .btn { padding:9px 18px; font-family:var(--font-hd); font-size:9px; letter-spacing:2px; cursor:pointer; background:var(--cyan-dim); border:1px solid var(--cyan); color:var(--cyan); text-transform:uppercase; }
      `}</style>

      <div className="notif" id="notif"></div>

      <div className="header">
        <div className="logo">CYBER<em>·</em>DISPATCH TERMINAL</div>
        <div style={{ display:'flex', gap:'20px', alignItems:'center' }}>
          <div id="clock" style={{ fontFamily:'var(--font-hd)', color:'var(--cyan)', opacity:0.6, fontSize:'12px' }}>00:00:00</div>
        </div>
      </div>

      <nav className="nav">
        <button className="nav-tab active" onClick={(e) => (window as any).goTab('carriers', e.currentTarget)}>◈ ПЕРЕВІЗНИКИ</button>
        <button className="nav-tab" onClick={(e) => (window as any).goTab('routes', e.currentTarget)}>⬡ МАРШРУТИ</button>
        <button className="nav-tab" onClick={(e) => (window as any).goTab('tickets', e.currentTarget)}>✦ БІЛЕТИ</button>
      </nav>

      <div className="page">
        <div className="tab-content active" id="tab-carriers">
          <div className="sec-title">АКТИВНІ ПЕРЕВІЗНИКИ</div>
          <div id="carriers-list"></div>
        </div>

        <div className="tab-content" id="tab-routes" style={{ display:'none' }}>
          <div className="sec-title">МАРШРУТНА МЕРЕЖА</div>
          <div id="routes-list"></div>
        </div>
      </div>
    </div>
  );
}
