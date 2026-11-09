import fs from 'fs';

async function scan() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();
  
  // Search for environment object
  const envMatches = code.match(/environment\s*=\s*\{[^}]+\}/g);
  console.log('Environment matches:', envMatches);

  // Search for any hardcoded JWT or tokens (eyJ...)
  const jwtMatches = code.match(/eyJ[a-zA-Z0-9_\-\.]+/g);
  console.log('JWT matches:', jwtMatches);

  // Search for any strings containing "Bearer"
  const bearerMatches = code.match(/Bearer\s+[^"'\s`]+/g);
  console.log('Bearer matches:', bearerMatches);

  // Search for Api-Key or ApiKey
  const apiKeyMatches = code.match(/api[-_]?key["']?\s*[:=]\s*["']([^"']+)["']/gi);
  console.log('API key matches:', apiKeyMatches);

  // Search for words containing passenger / passengers / manifest
  const passWords = code.match(/[a-zA-Z0-9_]*passenger[a-zA-Z0-9_]*/gi);
  console.log('Passenger related terms (sample):', Array.from(new Set(passWords || [])).slice(0, 30));

  // Search for manifest
  const manifestWords = code.match(/[a-zA-Z0-9_]*manifest[a-zA-Z0-9_]*/gi);
  console.log('Manifest terms:', Array.from(new Set(manifestWords || [])));

  // Search for order / orders
  const orderWords = code.match(/[a-zA-Z0-9_]*order[a-zA-Z0-9_]*/gi);
  console.log('Order terms (sample):', Array.from(new Set(orderWords || [])).slice(0, 30));
}

scan();

