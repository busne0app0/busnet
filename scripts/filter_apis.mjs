import fs from 'fs';

async function listInteresting() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();
  const regex = /tryCallApiAsync\(\s*[`"']([^`"']+)[`"']/g;
  let m;
  const apis = new Set();
  while ((m = regex.exec(code)) !== null) {
    apis.add(m[1]);
  }
  
  const keywords = ['ticket', 'order', 'passenger', 'trip', 'manifest', 'statement', 'report', 'seat', 'booking'];
  const filtered = [...apis].filter(a => keywords.some(k => a.toLowerCase().includes(k)));
  console.log('Filtered APIs count:', filtered.length);
  console.log(filtered.sort());
}

listInteresting();

