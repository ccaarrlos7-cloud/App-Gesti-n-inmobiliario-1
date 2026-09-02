const fs = require('fs');

function processFile(filePath, isCrm) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add Eye to lucide-react imports if it's missing
  if (!content.includes('Eye,')) {
    content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, imports) => {
      if (!imports.includes('Eye')) {
        return `import {${imports}, Eye} from 'lucide-react';`;
      }
      return match;
    });
  }

  if (isCrm) {
    // CRMView.tsx
    const oldHtml = `<a 
                                href={doc.url} 
                                download={doc.name}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              >
                                <Download size={16} />
                              </a>`;
    const newHtml = `<a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                                title="Ver documento"
                              >
                                <Eye size={16} />
                              </a>
                              <a 
                                href={doc.url} 
                                download={doc.name}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                title="Descargar documento"
                              >
                                <Download size={16} />
                              </a>`;
    content = content.replace(oldHtml, newHtml);
  } else {
    // PortfolioView.tsx
    const files = [
      { url: 'selectedProperty.rentalContractUrl', name: 'Contrato_Alquiler' },
      { url: 'selectedProperty.purchaseDocumentUrl', name: 'Documento_Compra' },
      { url: 'selectedProperty.mortgageDocumentUrl', name: 'Documento_Hipoteca' },
    ];

    files.forEach(f => {
      const oldHtml = `<a href={${f.url}} download="${f.name}" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                     <Download size={14} />
                                   </a>`;
      const newHtml = `<a href={${f.url}} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline" title="Ver">
                                     <Eye size={14} />
                                   </a>
                                   <a href={${f.url}} download="${f.name}" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline" title="Descargar">
                                     <Download size={14} />
                                   </a>`;
      content = content.replace(oldHtml, newHtml);
    });
  }

  fs.writeFileSync(filePath, content);
}

processFile('src/components/CRMView.tsx', true);
processFile('src/components/PortfolioView.tsx', false);
console.log('Icons added');
