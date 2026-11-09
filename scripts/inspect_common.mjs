import fs from 'fs';

async function scanCommon() {
  const code = await (await fetch('https://al-trans.com.ua/common.05d5499674bfe8b3.js')).text();
  const apis = code.match(/api\/[a-zA-Z0-9_\-\/]+/g) || [];
  console.log('APIs in common chunk:');
  console.log(Array.from(new Set(apis)).sort());
}

scanCommon();

