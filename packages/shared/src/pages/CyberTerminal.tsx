import React, { useEffect } from 'react';

/**
 * CyberTerminal - MISSION CONTROL TERMINAL
 * (Fixed TypeScript & Build errors)
 */
export default function CyberTerminal() {
  useEffect(() => {
    // We use a simpler way to inject the script to avoid template literal hell
    const script = document.createElement('script');
    script.innerHTML = `
      (function() {
        const DB = { 
          carriers: [
            { id: 'c1', name: 'BUS TRANSFER UA-IT', code: 'BTIT', color: '#00f2ff', phone: '+380 67 000 0000' }
          ], 
          routes: [
            { id: 'r1', carrierId: 'c1', name: 'Одеса — Салерно' }
          ], 
          stops: {}, 
          tickets: [] 
        };

        window.notify = (msg) => {
          const el = document.getElementById('notif');
          if(!el) return;
          el.textContent = msg;
          el.className = 'notif show ok';
          setTimeout(() => el.classList.remove('show'), 3000);
        };

        window.goTab = (name, btn) => {
          document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          const target = document.getElementById('tab-' + name);
          if(target) target.style.display = 'block';
          if(btn) btn.classList.add('active');
        };

        const renderCarriers = () => {
          const el = document.getElementById('carriers-list');
          if(!el) return;
          el.innerHTML = DB.carriers.map(c => 
            '<div class="carrier-card" onclick="window.notify(\\'Ви обрали \\' + \\'' + c.name + '\\')">' +
              '<div class="carrier-logo" style="background:' + c.color + '20;border:1px solid ' + c.color + '40;color:' + c.color + '">' + c.code + '</div>' +
              '<div class="carrier-info">' +
                '<div class="carrier-name">' + c.name + '</div>' +
                '<div class="carrier-meta">' + c.phone + '</div>' +
              '</div>' +
            '</div>'
          ).join('');
        };

        const renderRoutes = () => {
          const el = document.getElementById('routes-list');
          if(!el) return;
          el.innerHTML = DB.routes.map(r => 
            '<div class="route-card">' +
              '<div class="route-title">' + r.name + '</div>' +
              '<div class="route-sub">Маршрут ID: ' + r.id + '</div>' +
            '</div>'
          ).join('');
        };

        renderCarriers();
        renderRoutes();

        setInterval(() => { 
          const clock = document.getElementById('clock');
          if(clock) clock.textContent = new Date().toLocaleTimeString('uk-UA'); 
        }, 1000);
      })();
    `;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <div className="cyber-terminal-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .cyber-terminal-root {
          --bg:#050505;
          --cyan:#00f2ff;
          --pink:#ff00ff;
          --border:rgba(0,242,255,0.18);
          --text:#d0e8f8;
          --text-muted:#4a6880;
          background: #050505;
          color: #d0e8f8;
          min-height: 100vh;
          position: fixed;
          inset: 0;
          z-index: 9999;
          overflow-y: auto;
          font-family: monospace;
        }
        .header { padding: 14px 28px; border-bottom: 1px solid var(--border); background: rgba(5,5,5,0.95); display: flex; align-items: center; justify-content: space-between; }
        .logo { font-size: 17px; font-weight: 900; color: var(--cyan); letter-spacing: 4px; }
        .nav { display: flex; border-bottom: 1px solid var(--border); background: rgba(5,5,5,0.9); padding: 0 28px; }
        .nav-tab { padding: 12px 22px; font-size: 10px; color: var(--text-muted); cursor: pointer; border: none; background: transparent; border-bottom: 2px solid transparent; }
        .nav-tab.active { color: var(--cyan); border-bottom-color: var(--cyan); }
        .page { padding: 28px; }
        .sec-title { font-size: 9px; letter-spacing: 4px; color: var(--pink); margin-bottom: 16px; border-bottom: 1px solid rgba(255,0,255,0.2); text-transform: uppercase; }
        .carrier-card, .route-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 14px; margin-bottom: 10px; cursor: pointer; display: flex; align-items: center; gap: 12px; }
        .carrier-logo { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 4px; }
        .carrier-name, .route-title { font-size: 12px; color: var(--cyan); font-weight: bold; }
        .carrier-meta, .route-sub { font-size: 10px; color: var(--text-muted); }
        .notif { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #00f2ff; color: #000; border-radius: 4px; transform: translateX(200%); transition: 0.3s; z-index: 10001; font-weight: bold; font-size: 12px; }
        .notif.show { transform: translateX(0); }
      `}} />

      <div className="notif" id="notif">Повідомлення</div>

      <div className="header">
        <div className="logo">CYBER DISPATCH TERMINAL</div>
        <div id="clock" style={{ color: 'var(--cyan)', opacity: 0.6, fontSize: '12px' }}>00:00:00</div>
      </div>

      <nav className="nav">
        <button className="nav-tab active" onClick={(e) => (window as any).goTab('carriers', e.currentTarget)}>◈ ПЕРЕВІЗНИКИ</button>
        <button className="nav-tab" onClick={(e) => (window as any).goTab('routes', e.currentTarget)}>⬡ МАРШРУТИ</button>
      </nav>

      <div className="page">
        <div className="tab-content" id="tab-carriers">
          <div className="sec-title">АКТИВНІ ПЕРЕВІЗНИКИ</div>
          <div id="carriers-list"></div>
        </div>

        <div className="tab-content" id="tab-routes" style={{ display: 'none' }}>
          <div className="sec-title">МАРШРУТНА МЕРЕЖА</div>
          <div id="routes-list"></div>
        </div>
      </div>
    </div>
  );
}
