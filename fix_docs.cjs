const fs = require('fs');

const portfolioFile = 'src/components/PortfolioView.tsx';
let portfolio = fs.readFileSync(portfolioFile, 'utf8');

const oldDocsSection = `                       {(selectedProperty.purchaseDocumentUrl || selectedProperty.mortgageDocumentUrl || selectedProperty.rentalContractUrl) && (
                         <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold mb-3">{isEs ? 'Documentos Adjuntos' : 'Attached Documents'}</div>
                           <div className="space-y-3 text-[13px]">
                             {selectedProperty.rentalContractUrl && (
                               <a href={selectedProperty.rentalContractUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline p-2 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/40">
                                 <FileText size={16} className="text-blue-500" /> {isEs ? 'Contrato de Alquiler' : 'Rental Contract'}
                                </a>
                             )}
                             {selectedProperty.purchaseDocumentUrl && (
                               <a href={selectedProperty.purchaseDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium hover:underline p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                 <FileText size={16} className="text-slate-400" /> {isEs ? 'Documento de Compra' : 'Purchase Deed'}
                               </a>
                             )}
                             {selectedProperty.mortgageDocumentUrl && (
                               <a href={selectedProperty.mortgageDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium hover:underline p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                 <FileText size={16} className="text-slate-400" /> {isEs ? 'Documento de Hipoteca' : 'Mortgage Document'}
                               </a>
                             )}
                           </div>
                         </div>
                       )}`;

const newDocsSection = `                       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold mb-3 flex items-center justify-between">
                             <span>{isEs ? 'Documentos Adjuntos' : 'Attached Documents'}</span>
                           </div>
                           <div className="space-y-3 text-[13px]">
                             
                             {/* Contrato Alquiler */}
                             <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                               <div className="flex items-center gap-2">
                                 <FileText size={16} className="text-blue-500" />
                                 <span className="font-semibold text-slate-700 dark:text-slate-300">{isEs ? 'Contrato Alquiler' : 'Rental Contract'}</span>
                               </div>
                               {selectedProperty.rentalContractUrl ? (
                                 <div className="flex items-center gap-2">
                                   <a href={selectedProperty.rentalContractUrl} download="Contrato_Alquiler" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                     <Download size={14} />
                                   </a>
                                   <button onClick={() => {
                                      const updated = { ...selectedProperty, rentalContractUrl: '' };
                                      setSelectedProperty(updated);
                                      updateProperty(updated);
                                   }} className="text-slate-400 hover:text-red-500">
                                     <Trash2 size={14} />
                                   </button>
                                 </div>
                               ) : (
                                 <label className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
                                   <Upload size={14} /> {isEs ? 'Subir' : 'Upload'}
                                   <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            const updated = { ...selectedProperty, rentalContractUrl: event.target.result as string };
                                            setSelectedProperty(updated);
                                            updateProperty(updated);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                      e.target.value = '';
                                   }} />
                                 </label>
                               )}
                             </div>

                             {/* Documento Compra */}
                             <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                               <div className="flex items-center gap-2">
                                 <FileText size={16} className="text-slate-500" />
                                 <span className="font-semibold text-slate-700 dark:text-slate-300">{isEs ? 'Documento Compra' : 'Purchase Deed'}</span>
                               </div>
                               {selectedProperty.purchaseDocumentUrl ? (
                                 <div className="flex items-center gap-2">
                                   <a href={selectedProperty.purchaseDocumentUrl} download="Documento_Compra" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                     <Download size={14} />
                                   </a>
                                   <button onClick={() => {
                                      const updated = { ...selectedProperty, purchaseDocumentUrl: '' };
                                      setSelectedProperty(updated);
                                      updateProperty(updated);
                                   }} className="text-slate-400 hover:text-red-500">
                                     <Trash2 size={14} />
                                   </button>
                                 </div>
                               ) : (
                                 <label className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
                                   <Upload size={14} /> {isEs ? 'Subir' : 'Upload'}
                                   <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            const updated = { ...selectedProperty, purchaseDocumentUrl: event.target.result as string };
                                            setSelectedProperty(updated);
                                            updateProperty(updated);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                      e.target.value = '';
                                   }} />
                                 </label>
                               )}
                             </div>

                             {/* Documento Hipoteca */}
                             {selectedProperty.hasMortgage && (
                               <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                 <div className="flex items-center gap-2">
                                   <FileText size={16} className="text-slate-500" />
                                   <span className="font-semibold text-slate-700 dark:text-slate-300">{isEs ? 'Documento Hipoteca' : 'Mortgage Document'}</span>
                                 </div>
                                 {selectedProperty.mortgageDocumentUrl ? (
                                   <div className="flex items-center gap-2">
                                     <a href={selectedProperty.mortgageDocumentUrl} download="Documento_Hipoteca" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                       <Download size={14} />
                                     </a>
                                     <button onClick={() => {
                                        const updated = { ...selectedProperty, mortgageDocumentUrl: '' };
                                        setSelectedProperty(updated);
                                        updateProperty(updated);
                                     }} className="text-slate-400 hover:text-red-500">
                                       <Trash2 size={14} />
                                     </button>
                                   </div>
                                 ) : (
                                   <label className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
                                     <Upload size={14} /> {isEs ? 'Subir' : 'Upload'}
                                     <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              const updated = { ...selectedProperty, mortgageDocumentUrl: event.target.result as string };
                                              setSelectedProperty(updated);
                                              updateProperty(updated);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                        e.target.value = '';
                                     }} />
                                   </label>
                                 )}
                               </div>
                             )}

                           </div>
                         </div>`;

portfolio = portfolio.replace(oldDocsSection, newDocsSection);

// Make sure Upload and Trash2 are imported
if (!portfolio.includes('Trash2')) {
  portfolio = portfolio.replace('FileText,', 'FileText, Trash2, Upload, Download,');
} else {
  if (!portfolio.includes('Upload,')) {
    portfolio = portfolio.replace('Trash2,', 'Trash2, Upload, Download,');
  }
}

fs.writeFileSync(portfolioFile, portfolio);

const propertyFieldsFile = 'src/components/PropertyFields.tsx';
let propertyFields = fs.readFileSync(propertyFieldsFile, 'utf8');

const oldFieldsRegex = /<div>\s*<label className="block text-\[11px\].*?Contrato Alquiler[\s\S]*?<\/label>[\s\S]*?<\/div>\s*<div>\s*<label className="block text-\[11px\].*?Documento Compra[\s\S]*?<\/label>[\s\S]*?<\/div>\s*\{data\.hasMortgage && \(\s*<div>\s*<label className="block text-\[11px\].*?Documento Hipoteca[\s\S]*?<\/label>[\s\S]*?<\/div>\s*\)\}/;

propertyFields = propertyFields.replace(oldFieldsRegex, '{/* Document fields moved to Info View */}');

fs.writeFileSync(propertyFieldsFile, propertyFields);
console.log("Done");
