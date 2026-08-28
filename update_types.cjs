const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');
if (!content.includes('documents?: {')) {
  content = content.replace(
    "monthlyPayments?: Record<string, 'Al día' | 'Pendiente' | 'Deuda'>;",
    "monthlyPayments?: Record<string, 'Al día' | 'Pendiente' | 'Deuda'>;\n  documents?: { id: string; name: string; url: string; date: string; size?: number }[];"
  );
  fs.writeFileSync('src/types.ts', content);
  console.log('Types updated');
} else {
  console.log('Types already updated');
}
