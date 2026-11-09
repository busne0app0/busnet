import fs from 'fs';

async function scanTokens() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();

  // Search for emails
  const emails = code.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  console.log('Emails in code:', Array.from(new Set(emails)));

  // Search for passwords or password fields
  const pw = code.match(/password\s*[:=]\s*["'][^"']+["']/gi) || [];
  console.log('Password strings in code:', Array.from(new Set(pw)));

  // Search for Authorization or token strings
  const tokens = code.match(/["'][A-Za-z0-9+/=]{30,}["']/g) || [];
  console.log('Long base64 or tokens in code:', tokens.slice(0, 10));
}

scanTokens();

