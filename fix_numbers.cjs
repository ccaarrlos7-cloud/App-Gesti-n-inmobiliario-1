const fs = require('fs');
const files = ['src/components/DashboardView.tsx', 'src/components/PortfolioView.tsx', 'src/components/CRMView.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // First fix the corrupted lines from my bad sed command
  content = content.replace(/\{([^\{\}]+) \)\}/g, '{$1.toLocaleString("es-ES")}'); // Wait, let me just look for `.toLocaleString` again? No, I replaced it.
  
  // Actually, I can just use a regex to find all the broken things:
  // e.g. {ingresosMes )} -> {formatNumber(ingresosMes)}
  content = content.replace(/\{([a-zA-Z0-9_\.\?\(\)]+)\s*\)\}/g, '{formatNumber($1)}');
  
  // also fix the template literal ones: `${... )}`
  content = content.replace(/\$\{([a-zA-Z0-9_\.\?\(\)]+)\s*\)\}/g, '${formatNumber($1)}');
  
  // Let's replace any remaining toLocaleString in these files
  content = content.replace(/\{([a-zA-Z0-9_\.\?\(\)]+)\.toLocaleString\([^\)]*\)\}/g, '{formatNumber($1)}');
  content = content.replace(/\$\{([a-zA-Z0-9_\.\?\(\)]+)\.toLocaleString\([^\)]*\)\}/g, '${formatNumber($1)}');

  fs.writeFileSync(file, content);
});
console.log('Fixed numbers!');
