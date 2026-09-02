import React, { useState } from 'react';
import { Property } from '../types';
import { useAppContext } from '../store';
import FormattedNumberInput from './FormattedNumberInput';
import { uploadDocument, deleteDocument, resolveDocumentUrl } from '../lib/documentStorage';

interface Props {
  data: Partial<Property>;
  onChange: (data: Partial<Property>) => void;
}

export default function PropertyFields({ data, onChange }: Props) {
  const { language } = useAppContext();
  const isEs = language === 'Español';
  const update = (key: keyof Property, value: any) => onChange({ ...data, [key]: value });
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  const handleUpload = async (key: keyof Property, file: File) => {
    setIsUploading(key as string);
    try {
      const path = await uploadDocument(file);
      // If there was an old storage document, delete it
      if (data[key] && typeof data[key] === 'string') {
        await deleteDocument(data[key] as string);
      }
      update(key, path);
    } catch (e) {
      console.error("Upload error:", e);
      alert(isEs ? "Error al subir el archivo" : "Error uploading file");
    } finally {
      setIsUploading(null);
    }
  };

  const handleDelete = async (key: keyof Property) => {
    if (data[key] && typeof data[key] === 'string') {
      await deleteDocument(data[key] as string);
      update(key, '');
    }
  };

  const handleDownload = async (e: React.MouseEvent, docUrl: string, fileName: string) => {
    e.preventDefault();
    const url = await resolveDocumentUrl(docUrl);
    if (!url) return;
    
    if (url.startsWith('http')) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objectUrl);
      } catch (err) {
        console.error("Error fetching file for download", err);
      }
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
          {isEs ? 'Datos Básicos' : 'Basic Information'}
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Nombre / Alias' : 'Name / Alias'}
            </label>
            <input 
              type="text" 
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.title || ''} 
              onChange={e => update('title', e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Dirección' : 'Address'}
            </label>
            <input 
              type="text" 
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.address || ''} 
              onChange={e => update('address', e.target.value)} 
              required 
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
             <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                {isEs ? 'C.P.' : 'Zip Code'}
              </label>
              <input 
                type="text" 
                className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
                value={data.zipCode || ''} 
                onChange={e => update('zipCode', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                {isEs ? 'Ciudad' : 'City'}
              </label>
              <input 
                type="text" 
                className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
                value={data.city || ''} 
                onChange={e => update('city', e.target.value)} 
              />
            </div>
             <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                {isEs ? 'Provincia' : 'Province'}
              </label>
              <input 
                type="text" 
                className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
                value={data.province || ''} 
                onChange={e => update('province', e.target.value)} 
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
          {isEs ? 'Clasificación' : 'Classification'}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Tipo de inmueble' : 'Property Type'}
            </label>
            <select 
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.type || 'Piso'} 
              onChange={e => update('type', e.target.value)}
            >
              <option value="Local">{isEs ? 'Local' : 'Commercial Space'}</option>
              <option value="Garaje">{isEs ? 'Garaje' : 'Garage'}</option>
              <option value="Trastero">{isEs ? 'Trastero' : 'Storage'}</option>
              <option value="Casa">{isEs ? 'Casa' : 'House'}</option>
              <option value="Piso">{isEs ? 'Piso' : 'Apartment'}</option>
              <option value="Edificio">{isEs ? 'Edificio' : 'Building'}</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Estado' : 'Status'}
            </label>
            <select 
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.status || 'Vacío'} 
              onChange={e => update('status', e.target.value)}
            >
              <option value="Ocupado">{isEs ? 'Ocupado' : 'Occupied'}</option>
              <option value="Vacío">{isEs ? 'Vacío' : 'Vacant'}</option>
              <option value="En Reforma">{isEs ? 'En Reforma' : 'Under Renovation'}</option>
              <option value="En Venta">{isEs ? 'En Venta' : 'For Sale'}</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
          {isEs ? 'Características' : 'Features'}
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
           <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Metros Cuadrados' : 'Square Meters (m²)'}
            </label>
            <FormattedNumberInput 
              decimals={2}
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.sqm ?? ''} 
              onChange={val => update('sqm', val)} 
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Nº Habitaciones' : 'Bedrooms'}
            </label>
            <FormattedNumberInput 
              decimals={0}
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.rooms ?? ''} 
              onChange={val => update('rooms', val)} 
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
            {isEs ? 'Referencia Catastral' : 'Cadastral Reference'}
          </label>
          <input 
            type="text" 
            className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
            value={data.cadastralReference || ''} 
            onChange={e => update('cadastralReference', e.target.value)} 
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
          {isEs ? 'Datos Económicos' : 'Financial Details'}
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {data.status === 'En Venta' ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                {isEs ? 'Valor de Mercado (€)' : 'Market Value (€)'}
              </label>
              <FormattedNumberInput 
                decimals={2}
                className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
                value={data.marketValue ?? ''} 
                onChange={val => update('marketValue', val)} 
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                {isEs ? 'Precio Alquiler / Mes (€)' : 'Rent Price / Month (€)'}
              </label>
              <FormattedNumberInput 
                decimals={2}
                className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
                value={data.price ?? ''} 
                onChange={val => update('price', val)} 
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Fecha de Compra' : 'Purchase Date'}
            </label>
            <input 
              type="date" 
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.purchaseDate || ''} 
              onChange={e => update('purchaseDate', e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Valor de Compra (€)' : 'Purchase Price (€)'}
            </label>
            <FormattedNumberInput 
              decimals={2}
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.purchasePrice ?? ''} 
              onChange={val => update('purchasePrice', val)} 
            />
          </div>
           <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Entrada Pagada (€)' : 'Down Payment (€)'}
            </label>
            <FormattedNumberInput 
              decimals={2}
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.downPayment ?? ''} 
              onChange={val => update('downPayment', val)} 
            />
          </div>
           <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Gastos Adquisición (€)' : 'Acquisition Expenses (€)'}
            </label>
            <FormattedNumberInput 
              decimals={2}
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.purchaseExpenses ?? ''} 
              onChange={val => update('purchaseExpenses', val)} 
            />
          </div>
           <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Gastos de Reforma (€)' : 'Renovation Expenses (€)'}
            </label>
            <FormattedNumberInput 
              decimals={2}
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.renovationExpenses ?? ''} 
              onChange={val => update('renovationExpenses', val)} 
            />
          </div>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mt-4">
          <label className="flex items-center gap-2 text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!data.hasMortgage} onChange={e => update('hasMortgage', e.target.checked)} />
            {isEs ? 'El inmueble tiene hipoteca' : 'Property has a mortgage'}
          </label>
          {data.hasMortgage && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                {isEs ? 'Cuota Hipoteca Mensual (€)' : 'Monthly Mortgage Payment (€)'}
              </label>
              <FormattedNumberInput 
                decimals={2}
                className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
                value={data.mortgageInstallment ?? ''} 
                onChange={val => update('mortgageInstallment', val)} 
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Comunidad (€/mes)' : 'HOA / Community (€/mo)'}
            </label>
            <FormattedNumberInput 
              decimals={2}
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.communityFees ?? ''} 
              onChange={val => update('communityFees', val)} 
              placeholder="0" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'IBI (€/año)' : 'Property Tax / IBI (€/yr)'}
            </label>
            <FormattedNumberInput 
              decimals={2}
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" 
              value={data.ibi ?? ''} 
              onChange={val => update('ibi', val)} 
              placeholder="0" 
            />
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
          {isEs ? 'Multimedia, Documentos y Notas' : 'Media, Documents & Notes'}
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Galería de Fotos' : 'Photo Gallery'}
            </label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 mb-3"
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                const newGallery = [...(data.gallery || [])];
                
                Array.from(files).forEach((file: File) => {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      newGallery.push(event.target.result as string);
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
                        <div className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{isEs ? 'Principal' : 'Main'}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Contrato Alquiler' : 'Rental Contract'}
            </label>
            {data.rentalContractUrl ? (
              <div className="flex items-center gap-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800">
                 <a href="#" onClick={(e) => handleDownload(e, data.rentalContractUrl!, "Contrato_Alquiler")} className="text-blue-600 dark:text-blue-400 text-[13px] font-semibold hover:underline flex-1 truncate" title={isEs ? 'Descargar' : 'Download'}>
                   {isEs ? 'Documento adjunto (Ver / Descargar)' : 'Attached Document (View / Download)'}
                 </a>
                 <button type="button" onClick={() => handleDelete('rentalContractUrl')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded transition-colors" title={isEs ? 'Eliminar documento' : 'Delete document'}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  disabled={isUploading === 'rentalContractUrl'}
                  className="w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:uppercase file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUpload('rentalContractUrl', file);
                    }
                  }}
                />
                {isUploading === 'rentalContractUrl' && <span className="text-xs text-blue-500">{isEs ? 'Subiendo...' : 'Uploading...'}</span>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Documento Compra' : 'Purchase Deed / Document'}
            </label>
            {data.purchaseDocumentUrl ? (
              <div className="flex items-center gap-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800">
                 <a href="#" onClick={(e) => handleDownload(e, data.purchaseDocumentUrl!, "Documento_Compra")} className="text-blue-600 dark:text-blue-400 text-[13px] font-semibold hover:underline flex-1 truncate" title={isEs ? 'Descargar' : 'Download'}>
                   {isEs ? 'Documento adjunto (Ver / Descargar)' : 'Attached Document (View / Download)'}
                 </a>
                 <button type="button" onClick={() => handleDelete('purchaseDocumentUrl')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded transition-colors" title={isEs ? 'Eliminar documento' : 'Delete document'}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  disabled={isUploading === 'purchaseDocumentUrl'}
                  className="w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:uppercase file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUpload('purchaseDocumentUrl', file);
                    }
                  }}
                />
                {isUploading === 'purchaseDocumentUrl' && <span className="text-xs text-blue-500">{isEs ? 'Subiendo...' : 'Uploading...'}</span>}
              </div>
            )}
          </div>
          {data.hasMortgage && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Documento Hipoteca' : 'Mortgage Document'}
            </label>
            {data.mortgageDocumentUrl ? (
              <div className="flex items-center gap-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800">
                 <a href="#" onClick={(e) => handleDownload(e, data.mortgageDocumentUrl!, "Documento_Hipoteca")} className="text-blue-600 dark:text-blue-400 text-[13px] font-semibold hover:underline flex-1 truncate" title={isEs ? 'Descargar' : 'Download'}>
                   {isEs ? 'Documento adjunto (Ver / Descargar)' : 'Attached Document (View / Download)'}
                 </a>
                 <button type="button" onClick={() => handleDelete('mortgageDocumentUrl')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded transition-colors" title={isEs ? 'Eliminar documento' : 'Delete document'}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  disabled={isUploading === 'mortgageDocumentUrl'}
                  className="w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:uppercase file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUpload('mortgageDocumentUrl', file);
                    }
                  }}
                />
                {isUploading === 'mortgageDocumentUrl' && <span className="text-xs text-blue-500">{isEs ? 'Subiendo...' : 'Uploading...'}</span>}
              </div>
            )}
          </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
              {isEs ? 'Notas / Info Adicional' : 'Notes / Additional Info'}
            </label>
            <textarea 
              rows={3} 
              className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none" 
              value={data.notes || ''} 
              onChange={e => update('notes', e.target.value)} 
              placeholder={isEs ? "Escribe aquí cualquier otra información..." : "Type any additional information here..."}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
