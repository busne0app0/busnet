import fs from 'fs';

async function main() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();
  const regex = /path:\s*['"]([^'"]+)['"]/g;
  let m;
  const paths = new Set();
  while ((m = regex.exec(code)) !== null) {
    paths.add(m[1]);
  }
  console.log('Routes in frontend:');
  console.log([...paths]);
}

main();

