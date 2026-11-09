import fs from 'fs';

async function listAllApiCalls() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();
  const regex = /tryCallApiAsync\(\s*[`"']([^`"']+)[`"']/g;
  let m;
  const apis = new Set();
  while ((m = regex.exec(code)) !== null) {
    apis.add(m[1]);
  }
  console.log('Total unique tryCallApiAsync targets:', apis.size);
  console.log([...apis].sort());
}

listAllApiCalls();

