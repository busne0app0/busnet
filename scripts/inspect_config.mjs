import fs from 'fs';

async function scanConfig() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();

  let idx = 0;
  console.log('=== SEARCH FOR commonApiKey ===');
  while ((idx = code.indexOf('commonApiKey', idx)) !== -1) {
    console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 200)));
    idx += 15;
  }
}

scanConfig();

