const fs = require('fs');

const file = 'src/components/DashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Tie the top cards to the REAL current year, not the selected year state for the chart
content = content.replace(
  "const currentMonth = `${year}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;",
  "const currentMonth = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;"
);

fs.writeFileSync(file, content);
console.log('Top cards updated');
