import fs from 'fs';

async function scanMethods() {
  const code = await (await fetch('https://al-trans.com.ua/main.1405cff5eb0426de.js')).text();
  
  const methods = [
    'GetPassengerPhonesByTicketsBookedByAdminsAsync',
    'openBusPassengerCityReportAsync',
    'openPassengerTransportationReportAsync',
    'getPassengerTripsStatsByYearAsync',
    'get_order_details',
    'getOrderDetailsAsync',
    'get_online_payment_links_by_order_id'
  ];

  for (const m of methods) {
    let idx = 0;
    console.log(`=== SEARCH FOR ${m} ===`);
    while ((idx = code.indexOf(m, idx)) !== -1) {
      console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 250)));
      idx += m.length + 10;
    }
  }
}

scanMethods();

