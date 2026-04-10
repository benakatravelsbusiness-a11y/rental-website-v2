const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/AdminDashboard.jsx', 'utf8');
c = c.replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
fs.writeFileSync('frontend/src/pages/AdminDashboard.jsx', c);
console.log('Fixed syntax errors');
