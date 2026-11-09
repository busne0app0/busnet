const fs = require('fs');
const l = fs.readFileSync('al_trans_routes_import.sql', 'utf8').split('\n')[95];
for (let i = 0; i < l.length; i++) {
  if (l[i] === "'") {
    console.log('Single quote at index', i, ':', l.substring(i - 15, i + 20));
  }
}
