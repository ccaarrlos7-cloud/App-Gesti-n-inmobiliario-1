const fs = require('fs');

const file = 'src/components/DashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Tooltip formatter safely
content = content.replace(
  "formatter={(value) => [`${formatNumber(value)} €`, undefined]}",
  "formatter={(value: any) => [`${formatNumber(Number(value))} €`, undefined]}"
);

fs.writeFileSync(file, content);
console.log('Tooltip updated');
