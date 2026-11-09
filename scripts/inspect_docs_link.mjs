import fs from 'fs';

async function scanDocs() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();

  let idx = 0;
  console.log('=== SEARCH FOR ApiDocumentation ===');
  while ((idx = code.indexOf('ApiDocumentation', idx)) !== -1) {
    console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 250)));
    idx += 16;
  }
}

scanDocs();

