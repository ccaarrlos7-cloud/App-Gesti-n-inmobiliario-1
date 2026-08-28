const fs = require('fs');

let content = fs.readFileSync('src/components/PropertyFields.tsx', 'utf8');

const renderFileField = (label, propertyKey) => `          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">${label}</label>
            {data.${propertyKey} ? (
              <div className="flex items-center gap-2 p-2 border border-slate-200 rounded bg-slate-50">
                 <a href={data.${propertyKey}} download="${label.replace(/\s+/g, '_')}" className="text-blue-600 text-[13px] font-semibold hover:underline flex-1 truncate" title="Descargar">
                   Documento adjunto (Ver / Descargar)
                 </a>
                 <button type="button" onClick={() => update('${propertyKey}', '')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Eliminar documento">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:uppercase file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          update('${propertyKey}', event.target.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>`;

const oldRentalContract = `          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">URL Contrato Alquiler</label>
            <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.rentalContractUrl || ''} onChange={e => update('rentalContractUrl', e.target.value)} placeholder="Enlace a Drive, Dropbox..." />
          </div>`;

const oldPurchase = `          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">URL Documento Compra</label>
            <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.purchaseDocumentUrl || ''} onChange={e => update('purchaseDocumentUrl', e.target.value)} placeholder="Enlace a Drive, Dropbox..." />
          </div>`;

const oldMortgage = `            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">URL Documento Hipoteca</label>
              <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.mortgageDocumentUrl || ''} onChange={e => update('mortgageDocumentUrl', e.target.value)} placeholder="Enlace a Drive, Dropbox..." />
            </div>`;

content = content.replace(oldRentalContract, renderFileField("Contrato Alquiler", "rentalContractUrl"));
content = content.replace(oldPurchase, renderFileField("Documento Compra", "purchaseDocumentUrl"));
content = content.replace(oldMortgage, renderFileField("Documento Hipoteca", "mortgageDocumentUrl"));

fs.writeFileSync('src/components/PropertyFields.tsx', content);
console.log('Fixed');
