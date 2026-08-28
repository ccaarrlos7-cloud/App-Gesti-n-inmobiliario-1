const fs = require('fs');

const file = 'src/components/DashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Make current month dynamic
content = content.replace(
  "const currentMonthTransactions = allTxs.filter(t => t.date.startsWith('2026-08'));",
  "const currentMonth = `${year}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;\n  const currentMonthTransactions = allTxs.filter(t => t.date.startsWith(currentMonth));"
);

// Fix 2: Format numbers in Recharts Tooltip
content = content.replace(
  "<Tooltip",
  "<Tooltip\n                  formatter={(value) => [`${formatNumber(value)} €`, undefined]}"
);

// Fix 3: Format numbers in Recharts YAxis
content = content.replace(
  "<YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />",
  "<YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => formatNumber(val)} />"
);

// We should also replace the title of "Resumen de Agosto" to dynamically show the month
content = content.replace(
  "Resumen de Agosto",
  "{`Resumen de ${monthsStr[new Date().getMonth()]}`}"
);

fs.writeFileSync(file, content);
console.log('DashboardView updated');
