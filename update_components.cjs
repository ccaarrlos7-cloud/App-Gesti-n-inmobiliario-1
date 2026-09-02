const fs = require('fs');

function updateCrm() {
  const filePath = 'src/components/CRMView.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes('DocumentActionButtons')) {
    content = content.replace("import { DocumentViewerModal } from './DocumentViewerModal';", "import { DocumentViewerModal } from './DocumentViewerModal';\nimport { DocumentActionButtons } from './DocumentActionButtons';");
  }

  // Replace buttons block
  const oldBlock = `                            <div className="flex items-center gap-2 shrink-0">
                              <button 
                                onClick={() => setViewingDoc({ url: doc.url, name: doc.name })}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                                title="Ver documento"
                              >
                                <Eye size={16} />
                              </button>
                              <a 
                                href={doc.url} 
                                download={doc.name}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                title="Descargar documento"
                              >
                                <Download size={16} />
                              </a>
                              <button 
                                onClick={() => {
                                  if(confirm(isEs ? '¿Eliminar documento?' : 'Delete document?')) {
                                    const updatedDocs = selectedContract.documents.filter(d => d.id !== doc.id);
                                    const updated = { ...selectedContract, documents: updatedDocs };
                                    setSelectedContract(updated);
                                    updateContract(updated);
                                  }
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>`;

  const newBlock = `                            <DocumentActionButtons 
                              onView={() => setViewingDoc({ url: doc.url, name: doc.name })}
                              downloadUrl={doc.url}
                              downloadName={doc.name}
                              onDelete={() => {
                                if(confirm(isEs ? '¿Eliminar documento?' : 'Delete document?')) {
                                  const updatedDocs = selectedContract.documents.filter(d => d.id !== doc.id);
                                  const updated = { ...selectedContract, documents: updatedDocs };
                                  setSelectedContract(updated);
                                  updateContract(updated);
                                }
                              }}
                              onDownload={() => {}} 
                            />`;

  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content);
}

function updatePortfolio() {
  const filePath = 'src/components/PortfolioView.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes('DocumentActionButtons')) {
    content = content.replace("import { DocumentViewerModal } from './DocumentViewerModal';", "import { DocumentViewerModal } from './DocumentViewerModal';\nimport { DocumentActionButtons } from './DocumentActionButtons';");
  }

  const files = [
    { url: 'selectedProperty.rentalContractUrl', name: 'Contrato Alquiler' },
    { url: 'selectedProperty.purchaseDocumentUrl', name: 'Documento Compra' },
    { url: 'selectedProperty.mortgageDocumentUrl', name: 'Documento Hipoteca' },
  ];

  files.forEach(f => {
    const filenameNoSpaces = f.name.replace(/ /g, '_');
    const oldHtml = `<div className="flex items-center gap-2">
                                   <button onClick={() => setViewingDoc({ url: ${f.url}!, name: '${f.name}' })} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline" title="Ver">
                                     <Eye size={14} />
                                   </button>
                                   <a href={${f.url}} download="${filenameNoSpaces}" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline" title="Descargar">
                                     <Download size={14} />
                                   </a>
                                   <button onClick={() => {
                                      const updated = { ...selectedProperty, ${f.url.split('.')[1]}: '' };
                                      setSelectedProperty(updated);
                                      updateProperty(updated);
                                   }} className="text-slate-400 hover:text-red-500">
                                     <Trash2 size={14} />
                                   </button>
                                 </div>`;
                                 
    const newHtml = `<DocumentActionButtons 
                                     onView={() => setViewingDoc({ url: ${f.url}!, name: '${f.name}' })}
                                     downloadUrl={${f.url}!}
                                     downloadName="${filenameNoSpaces}"
                                     onDelete={() => {
                                        if(confirm(isEs ? '¿Eliminar documento?' : 'Delete document?')) {
                                          const updated = { ...selectedProperty, ${f.url.split('.')[1]}: '' };
                                          setSelectedProperty(updated);
                                          updateProperty(updated);
                                        }
                                     }}
                                     onDownload={() => {}}
                                   />`;
    
    content = content.replace(oldHtml, newHtml);
  });

  fs.writeFileSync(filePath, content);
}

updateCrm();
updatePortfolio();
console.log('Updated components');
