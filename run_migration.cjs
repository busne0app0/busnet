const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://upwwhhfgpxgnxkbfwfve.supabase.co';
// We use the service role key stored in supabase CLI config
const { execSync } = require('child_process');

// Get service role key from supabase CLI
let serviceKey = '';
try {
  const out = execSync('npx supabase --experimental projects api-keys --project-ref upwwhhfgpxgnxkbfwfve --output json 2>&1', {
    cwd: __dirname, encoding: 'utf8', timeout: 15000
  });
  const parsed = JSON.parse(out);
  serviceKey = parsed.find(k => k.name === 'service_role')?.api_key || '';
} catch(e) {
  // Fallback: try to read from env files
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  // service key not in .env usually, use anon for now to test
  console.log('Could not get service key from CLI, checking env files...');
  console.log('Please set SUPABASE_SERVICE_ROLE_KEY in .env and rerun');
  process.exit(1);
}

if (!serviceKey) {
  console.error('Service role key not found');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20260518_consolidated_idempotent.sql'), 'utf8');

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const body = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', body.slice(0, 500));
}

run().catch(console.error);
