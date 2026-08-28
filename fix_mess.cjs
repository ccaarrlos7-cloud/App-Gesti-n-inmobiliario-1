const fs = require('fs');
const files = ['src/components/PortfolioView.tsx', 'src/components/CRMView.tsx', 'src/components/DashboardView.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/formatNumber\(formatNumber\(Date\.now\(\)/g, 'Date.now()');
  content = content.replace(/\{formatNumber\(formatDate\(([^)]+)\)\}/g, '{formatDate($1)}');
  content = content.replace(/\{formatNumber\(([^)]+)\.toFixed\(2\)\}/g, '{formatNumber($1, 2)}');
  content = content.replace(/\{formatNumber\(([^)]+)\.toFixed\(0\)\}/g, '{formatNumber($1, 0)}');
  content = content.replace(/\{formatNumber\(t\.name\.charAt\(0\)\}/g, '{t.name.charAt(0)}');
  
  fs.writeFileSync(file, content);
});
console.log('Fixed messes!');
