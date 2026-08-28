const fs = require('fs');

const file = 'src/components/CRMView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetString = "                      })}";
const insertionPoint = content.indexOf(targetString) + targetString.length;
const followingString = "\n                    </div>\n                  </div>";
const endOfSection = content.indexOf(followingString, insertionPoint);

if (endOfSection !== -1) {
  const insertIndex = endOfSection + followingString.length;
  
  const documentsSection = `
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5 tracking-wider">
                        <Paperclip size={14} /> Gestión Documental
                      </div>
                      <label className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer">
                        <Upload size={14} /> Subir Documento
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const newDoc = {
                                  id: \`doc-\${Date.now()}\`,
                                  name: file.name,
                                  url: event.target?.result as string,
                                  date: new Date().toISOString(),
                                  size: file.size
                                };
                                const updatedDocs = [...(selectedContract.documents || []), newDoc];
                                const updated = { ...selectedContract, documents: updatedDocs };
                                setSelectedContract(updated);
                                updateContract(updated);
                              };
                              reader.readAsDataURL(file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      {!selectedContract.documents || selectedContract.documents.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                          <p className="text-sm text-slate-400">No hay documentos adjuntos</p>
                        </div>
                      ) : (
                        selectedContract.documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-700 truncate">{doc.name}</p>
                                <p className="text-[11px] text-slate-400">
                                  {new Date(doc.date).toLocaleDateString()} {doc.size ? \`• \${(doc.size / 1024 / 1024).toFixed(2)} MB\` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a 
                                href={doc.url} 
                                download={doc.name}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Download size={16} />
                              </a>
                              <button 
                                onClick={() => {
                                  if(confirm('¿Eliminar documento?')) {
                                    const updatedDocs = selectedContract.documents.filter(d => d.id !== doc.id);
                                    const updated = { ...selectedContract, documents: updatedDocs };
                                    setSelectedContract(updated);
                                    updateContract(updated);
                                  }
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>`;
                  
  const newContent = content.slice(0, insertIndex) + documentsSection + content.slice(insertIndex);
  fs.writeFileSync(file, newContent);
  console.log('Documents section inserted successfully');
} else {
  console.log('Could not find insertion point');
}
