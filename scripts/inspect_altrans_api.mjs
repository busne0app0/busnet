import fs from 'fs';

async function main() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();
  
  const regex = /["'](\/api\/[^"']+)["']/g;
  let m;
  const apis = new Set();
  while ((m = regex.exec(code)) !== null) {
    apis.add(m[1]);
  }
  
  const regexBacktick = /`([^`]*\/api\/[^`]*)`/g;
  while ((m = regexBacktick.exec(code)) !== null) {
    apis.add(m[1]);
  }

  console.log('--- ALL APIS IN CLIENT JS ---');
  console.log([...apis].sort());
}

main();
