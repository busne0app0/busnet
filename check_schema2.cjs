
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
    console.log(Object.keys(swagger.definitions || {}));
    if (swagger.definitions && swagger.definitions.trips) {
        console.log('trips columns:', Object.keys(swagger.definitions.trips.properties));
    }
    if (swagger.definitions && swagger.definitions.bookings) {
        console.log('bookings columns:', Object.keys(swagger.definitions.bookings.properties));
    }
  });
});
req.end();
