import fs from 'fs';

async function scanPaths() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();

  const terms = ['"trips"', '"tickets"', '"users"', '"api-tokens"'];
  for (const t of terms) {
    let idx = 0;
    console.log(`=== SEARCH FOR ${t} ===`);
    while ((idx = code.indexOf(`path:${t}`, idx)) !== -1) {
      console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 400)));
      idx += t.length + 10;
    }
  }
}

scanPaths();

