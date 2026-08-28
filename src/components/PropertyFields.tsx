import React from 'react';
import { Property, PropertyStatus } from '../types';

interface Props {
  data: Partial<Property>;
  onChange: (data: Partial<Property>) => void;
}

export default function PropertyFields({ data, onChange }: Props) {
  const update = (key: keyof Property, value: any) => onChange({ ...data, [key]: value });

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Datos Básicos</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nombre / Alias</label>
            <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.title || ''} onChange={e => update('title', e.target.value)} required />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Dirección</label>
            <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.address || ''} onChange={e => update('address', e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-2">
             <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">C.P.</label>
              <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.zipCode || ''} onChange={e => update('zipCode', e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Ciudad</label>
              <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.city || ''} onChange={e => update('city', e.target.value)} />
            </div>
             <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Provincia</label>
              <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.province || ''} onChange={e => update('province', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Clasificación</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Tipo de inmueble</label>
            <select className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.type || 'Piso'} onChange={e => update('type', e.target.value)}>
              <option value="Local">Local</option>
              <option value="Garaje">Garaje</option>
              <option value="Trastero">Trastero</option>
              <option value="Casa">Casa</option>
              <option value="Piso">Piso</option>
              <option value="Edificio">Edificio</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Estado</label>
            <select className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.status || 'Vacío'} onChange={e => update('status', e.target.value)}>
              <option value="Ocupado">Ocupado</option>
              <option value="Vacío">Vacío</option>
              <option value="En Reforma">En Reforma</option>
              <option value="En Venta">En Venta</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Características</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
           <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Metros Cuadrados</label>
            <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.sqm || ''} onChange={e => update('sqm', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nº Habitaciones</label>
            <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.rooms || ''} onChange={e => update('rooms', Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Referencia Catastral</label>
          <input type="text" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.cadastralReference || ''} onChange={e => update('cadastralReference', e.target.value)} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Datos Económicos</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {data.status === 'En Venta' ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Valor de Mercado (€)</label>
              <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.marketValue || ''} onChange={e => update('marketValue', Number(e.target.value))} />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Precio Alquiler / Mes</label>
              <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.price || ''} onChange={e => update('price', Number(e.target.value))} />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Fecha de Compra</label>
            <input type="date" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.purchaseDate || ''} onChange={e => update('purchaseDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Valor de Compra (€)</label>
            <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.purchasePrice || ''} onChange={e => update('purchasePrice', Number(e.target.value))} />
          </div>
           <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Entrada Pagada (€)</label>
            <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.downPayment || ''} onChange={e => update('downPayment', Number(e.target.value))} />
          </div>
           <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Gastos Adquisición (€)</label>
            <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.purchaseExpenses || ''} onChange={e => update('purchaseExpenses', Number(e.target.value))} />
          </div>
           <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Gastos de Reforma (€)</label>
            <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.renovationExpenses || ''} onChange={e => update('renovationExpenses', Number(e.target.value))} />
          </div>
        </div>
        
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 mt-4">
          <label className="flex items-center gap-2 text-[13px] font-bold text-slate-800 mb-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!data.hasMortgage} onChange={e => update('hasMortgage', e.target.checked)} />
            El inmueble tiene hipoteca
          </label>
          {data.hasMortgage && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Cuota Hipoteca Mensual (€)</label>
              <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white" value={data.mortgageInstallment || ''} onChange={e => update('mortgageInstallment', Number(e.target.value))} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Comunidad (€/mes)</label>
            <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.communityFees || ''} onChange={e => update('communityFees', Number(e.target.value))} placeholder="0" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">IBI (€/año)</label>
            <input type="number" className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50" value={data.ibi || ''} onChange={e => update('ibi', Number(e.target.value))} placeholder="0" />
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Multimedia, Documentos y Notas</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Galería de Fotos</label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3"
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                const newGallery = [...(data.gallery || [])];
                
                Array.from(files).forEach((file: File) => {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      newGallery.push(event.target.result as string);
                      // If it's the first image, make it the main one automatically
                      if (newGallery.length === 1 && !data.image) {
                        update('image', event.target.result as string);
                      }
                      update('gallery', newGallery);
                    }
                  };
                  reader.readAsDataURL(file);
                });
              }}
            />
            
            {(data.gallery?.length || 0) > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                {data.gallery?.map((img, idx) => (
                  <div key={idx} className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${data.image === img ? 'border-blue-500 shadow-sm' : 'border-transparent'}`} onClick={() => update('image', img)}>
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    {data.image === img && (
                      <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center">
                        <div className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">Principal</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Contrato Alquiler</label>
            {data.rentalContractUrl ? (
              <div className="flex items-center gap-2 p-2 border border-slate-200 rounded bg-slate-50">
                 <a href={data.rentalContractUrl} download="Contrato_Alquiler" className="text-blue-600 text-[13px] font-semibold hover:underline flex-1 truncate" title="Descargar">
                   Documento adjunto (Ver / Descargar)
                 </a>
                 <button type="button" onClick={() => update('rentalContractUrl', '')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Eliminar documento">
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
                          update('rentalContractUrl', event.target.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Documento Compra</label>
            {data.purchaseDocumentUrl ? (
              <div className="flex items-center gap-2 p-2 border border-slate-200 rounded bg-slate-50">
                 <a href={data.purchaseDocumentUrl} download="Documento_Compra" className="text-blue-600 text-[13px] font-semibold hover:underline flex-1 truncate" title="Descargar">
                   Documento adjunto (Ver / Descargar)
                 </a>
                 <button type="button" onClick={() => update('purchaseDocumentUrl', '')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Eliminar documento">
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
                          update('purchaseDocumentUrl', event.target.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>
          {data.hasMortgage && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Documento Hipoteca</label>
            {data.mortgageDocumentUrl ? (
              <div className="flex items-center gap-2 p-2 border border-slate-200 rounded bg-slate-50">
                 <a href={data.mortgageDocumentUrl} download="Documento_Hipoteca" className="text-blue-600 text-[13px] font-semibold hover:underline flex-1 truncate" title="Descargar">
                   Documento adjunto (Ver / Descargar)
                 </a>
                 <button type="button" onClick={() => update('mortgageDocumentUrl', '')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Eliminar documento">
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
                          update('mortgageDocumentUrl', event.target.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Notas / Info Adicional</label>
            <textarea rows={3} className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-slate-50 resize-none" value={data.notes || ''} onChange={e => update('notes', e.target.value)} placeholder="Escribe aquí cualquier otra información..."></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
