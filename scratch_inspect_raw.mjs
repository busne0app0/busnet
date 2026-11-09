import fs from 'fs';

const tripsData = JSON.parse(fs.readFileSync('./al_trans_search_trips.json', 'utf8'));
const routeData = JSON.parse(fs.readFileSync('./al_trans_route_details_key.json', 'utf8'));

console.log('=== 1. SEARCH_TRIPS (Ціни, Автобус, Телефони) ===');
console.log('server_execution_time:', tripsData.execution_time);
console.log('first_result:', JSON.stringify(tripsData.trips_sequences[0], null, 2).slice(0, 2000));

console.log('\n=== 2. ROUTE_DETAILS_KEY (Зупинки, Координати) ===');
console.log('server_execution_time:', routeData.execution_time);
console.log('first_2_stops:', JSON.stringify(routeData.route_lines[0].stops.slice(0, 2), null, 2));
