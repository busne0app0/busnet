import fs from 'fs';

async function scanModules() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();

  const terms = ['TicketsModule', 'TripsModule', 'OrdersModule'];
  for (const t of terms) {
    let idx = 0;
    console.log(`=== SEARCH FOR ${t} ===`);
    while ((idx = code.indexOf(t, idx)) !== -1) {
      console.log(code.substring(Math.max(0, idx - 150), Math.min(code.length, idx + 150)));
      idx += t.length + 10;
    }
  }
}

scanModules();

