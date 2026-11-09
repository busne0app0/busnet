import fs from 'fs';

async function scanHeaders() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();

  let idx = 0;
  console.log('=== SEARCH FOR _defaultApiHeaders ===');
  while ((idx = code.indexOf('_defaultApiHeaders', idx)) !== -1) {
    console.log(code.substring(Math.max(0, idx - 150), Math.min(code.length, idx + 250)));
    idx += 20;
  }

  console.log('=== SEARCH FOR Api-Key ===');
  idx = 0;
  while ((idx = code.indexOf('Api-Key', idx)) !== -1) {
    console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 200)));
    idx += 10;
  }
}

scanHeaders();

