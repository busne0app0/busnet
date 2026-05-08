const fs = require('fs');
const path = require('path');

const directories = ['packages/shared/src', 'apps/admin/src', 'apps/carrier/src', 'apps/landing/src'];

const mappings = {
  'totalPrice': 'total_price',
  'carrierId': 'carrier_id',
  'createdAt': 'created_at',
  'departureCity': 'departure_city',
  'arrivalCity': 'arrival_city',
  'departureDate': 'departure_date',
  'departureTime': 'departure_time',
  'userId': 'user_id',
  'updatedAt': 'updated_at',
  'stopsThere': 'stops_there',
  'stopsBack': 'stops_back',
  'tripId': 'trip_id',
  'routeFrom': 'route_from',
  'routeTo': 'route_to',
  'arrivalTime': 'arrival_time',
  'carrierName': 'carrier_name'
};

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else if (['.ts', '.tsx'].includes(path.extname(f))) {
      callback(dirPath);
    }
  });
}

let modifiedFiles = 0;

directories.forEach(dir => {
  walkDir(dir, filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    Object.keys(mappings).forEach(camel => {
      const snake = mappings[camel];
      
      // 1. Supabase methods: .eq('camelCase', ...)
      const methodRegex = new RegExp(`\\.(eq|neq|gt|gte|lt|lte|in|order|ilike|like)\\s*\\(\\s*['"]${camel}['"]`, 'g');
      content = content.replace(methodRegex, `.$1('${snake}'`);

      // 2. Multi-table eq: .eq('trips.carrierId', ...)
      const multiTableRegex = new RegExp(`\\.(eq|neq|gt|gte|lt|lte|in|order|ilike|like)\\s*\\(\\s*['"]([^'"]+)\\.${camel}['"]`, 'g');
      content = content.replace(multiTableRegex, `.$1('$2.${snake}'`);

      // 3. postgres_changes filters
      const filterRegex = new RegExp(`(filter:\\s*['"]\\s*)([^'"]+)?${camel}(=)`, 'g');
      content = content.replace(filterRegex, `$1$2${snake}$3`);

      // 4. .select('..., camelCase, ...')
      const selectRegex = /\.select\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      content = content.replace(selectRegex, (match, p1) => {
         let newSelect = p1;
         // Handle nested selects like trips!inner(id, carrierId)
         // This regex is complex, let's do a simple recursive token replacement for exact matches
         const tokens = newSelect.split(/([,()! ])/);
         const replacedTokens = tokens.map(token => {
            if (mappings[token]) return mappings[token];
            return token;
         });
         return `.select('${replacedTokens.join('')}')`;
      });
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Fixed:', filePath);
      modifiedFiles++;
    }
  });
});

console.log('Total files fixed:', modifiedFiles);
