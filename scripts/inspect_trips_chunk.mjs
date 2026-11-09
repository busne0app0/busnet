import fs from 'fs';

async function scanChunks() {
  for (const chunk of ['675.3080a722eec7e90d.js', '6065.b55b0447010a6ba8.js']) {
    console.log(`=== CHUNK: ${chunk} ===`);
    const code = await (await fetch(`https://al-trans.com.ua/${chunk}`)).text();
    const apis = code.match(/api\/[a-zA-Z0-9_\-\/]+/g) || [];
    console.log(Array.from(new Set(apis)));
  }
}

scanChunks();

