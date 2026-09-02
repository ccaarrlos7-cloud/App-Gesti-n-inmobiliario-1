const fs = require('fs');

function fixPortfolio() {
  const filePath = 'src/components/PortfolioView.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes("DocumentViewerModal")) {
    content = content.replace("import { Property, Tenant, Contract, Transaction, Issue } from '../types';", 
      "import { Property, Tenant, Contract, Transaction, Issue } from '../types';\nimport { DocumentViewerModal } from './DocumentViewerModal';");
  }

  // Add state
  if (!content.includes("const [viewingDoc, setViewingDoc]")) {
    content = content.replace("const [viewMode, setViewMode] = useState<'list' | 'info' | 'edit' | 'contract'>('list');",
      "const [viewMode, setViewMode] = useState<'list' | 'info' | 'edit' | 'contract'>('list');\n  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);");
  }

  // Replace Eye links with buttons
  const files = [
    { url: 'selectedProperty.rentalContractUrl', name: 'Contrato_Alquiler' },
    { url: 'selectedProperty.purchaseDocumentUrl', name: 'Documento_Compra' },
    { url: 'selectedProperty.mortgageDocumentUrl', name: 'Documento_Hipoteca' },
  ];

  files.forEach(f => {
    const oldHtml = `<a href={${f.url}} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline" title="Ver">
                                     <Eye size={14} />
                                   </a>`;
    const newHtml = `<button onClick={() => setViewingDoc({ url: ${f.url}!, name: '${f.name.replace('_', ' ')}' })} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline" title="Ver">
                                     <Eye size={14} />
                                   </button>`;
    content = content.replace(oldHtml, newHtml);
  });

  // Add Modal at the end
  if (!content.includes("<DocumentViewerModal")) {
    content = content.replace("</div>\n  );\n}", 
      `  {/* Document Viewer Modal */}\n      <DocumentViewerModal \n        isOpen={!!viewingDoc}\n        onClose={() => setViewingDoc(null)}\n        documentUrl={viewingDoc?.url || ''}\n        documentName={viewingDoc?.name || ''}\n      />\n    </div>\n  );\n}`);
  }

  fs.writeFileSync(filePath, content);
}

function fixCRM() {
  const filePath = 'src/components/CRMView.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes("DocumentViewerModal")) {
    content = content.replace("import { Tenant, Contract, Property, Issue } from '../types';", 
      "import { Tenant, Contract, Property, Issue } from '../types';\nimport { DocumentViewerModal } from './DocumentViewerModal';");
  }

  // Add state
  if (!content.includes("const [viewingDoc, setViewingDoc]")) {
    content = content.replace("const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');",
      "const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');\n  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);");
  }

  // Replace Eye link with button
  const oldHtml = `<a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                                title="Ver documento"
                              >
                                <Eye size={16} />
                              </a>`;
  const newHtml = `<button 
                                onClick={() => setViewingDoc({ url: doc.url, name: doc.name })}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                                title="Ver documento"
                              >
                                <Eye size={16} />
                              </button>`;
  content = content.replace(oldHtml, newHtml);

  // Add Modal at the end
  if (!content.includes("<DocumentViewerModal")) {
    content = content.replace("</div>\n  );\n}", 
      `  {/* Document Viewer Modal */}\n      <DocumentViewerModal \n        isOpen={!!viewingDoc}\n        onClose={() => setViewingDoc(null)}\n        documentUrl={viewingDoc?.url || ''}\n        documentName={viewingDoc?.name || ''}\n      />\n    </div>\n  );\n}`);
  }

  fs.writeFileSync(filePath, content);
}

fixPortfolio();
fixCRM();
console.log('Fixed viewers');
