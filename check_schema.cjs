const https = require('https');

const options = {
  hostname: 'upwwhhfgpxgnxkbfwfve.supabase.co',
  port: 443,
  path: '/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3doaGZncHhnbnhrYmZ3ZnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjIxMzIsImV4cCI6MjA5MjU5ODEzMn0.-uyKjGcuE_KJHjku6s_Ocnz3_ZWWVWiQJSeD8vf40ug',
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => { data += d; });
  res.on('end', () => {
    const swagger = JSON.parse(data);
    
    ['users', 'routes', 'trips', 'bookings', 'buses', 'drivers', 'balances', 'support', 'notifications', 'invoices'].forEach(table => {
      if (swagger.definitions && swagger.definitions[table]) {
        console.log(`Table ${table} columns:`, Object.keys(swagger.definitions[table].properties).join(', '));
      } else {
        console.log(`Table ${table} NOT FOUND in OpenAPI spec!`);
      }
    });
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
