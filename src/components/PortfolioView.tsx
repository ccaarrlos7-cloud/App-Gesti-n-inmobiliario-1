import React, { useState, useEffect } from 'react';
import { PropertyStatus, Property, Transaction } from '../types';
import { Search, AlertTriangle, CheckCircle, ChevronLeft, FileText, X, Edit, Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle, Trash2, Paperclip } from 'lucide-react';
import { useAppContext } from '../store';
import PropertyFields from './PropertyFields';
import { formatDate, formatNumber } from '../utils';
import SettingsModal from './SettingsModal';
import { User } from 'lucide-react';

export default function PortfolioView({ initialTab = 'Todos' }: { initialTab?: PropertyStatus | 'Todos' }) {
  const { properties, setProperties, updateProperty, contracts, tenants, getDynamicTransactions, addTransaction, issues, addIssue, updateIssue, deleteIssue } = useAppContext();
  const allTxs = getDynamicTransactions();
  const [activeTab, setActiveTab] = useState<PropertyStatus | 'Todos'>(initialTab);
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { userName, avatarUrl } = useAppContext();
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [viewMode, setViewMode] = useState<'info' | 'contract' | 'edit' | 'finanzas' | 'mantenimiento'>('info');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProp, setNewProp] = useState<Partial<Property>>({
    title: '', address: '', price: 0, status: 'Vacío', type: 'Piso', notes: ''
  });

  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'gasto', category: '', amount: 0, date: new Date().toISOString().split('T')[0], description: ''
  });

  const tabs: (PropertyStatus | 'Todos')[] = ['Todos', 'Ocupado', 'Vacío', 'En Reforma', 'En Venta'];

  const filteredProperties = properties.filter(p => {
    const matchesTab = activeTab === 'Todos' || p.status === activeTab;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const closeProperty = () => {
    setSelectedProperty(null);
    setViewMode('info');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const property: Property = {
      id: `p${Date.now()}`,
      title: newProp.title || '',
      address: newProp.address || '',
      zipCode: newProp.zipCode || '',
      city: newProp.city || '',
      province: newProp.province || '',
      price: Number(newProp.price) || 0,
      status: (newProp.status as PropertyStatus) || 'Vacío',
      type: newProp.type || 'Piso',
      notes: newProp.notes || '',
      sqm: Number(newProp.sqm) || 0,
      rooms: Number(newProp.rooms) || 0,
      cadastralReference: newProp.cadastralReference || '',
      purchaseDate: newProp.purchaseDate || '',
      purchasePrice: Number(newProp.purchasePrice) || 0,
      downPayment: Number(newProp.downPayment) || 0,
      purchaseExpenses: Number(newProp.purchaseExpenses) || 0,
      renovationExpenses: Number(newProp.renovationExpenses) || 0,
      hasMortgage: newProp.hasMortgage || false,
      mortgageInstallment: Number(newProp.mortgageInstallment) || 0,
      image: newProp.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60'
    };
    setProperties([property, ...properties]);
    setIsModalOpen(false);
    setNewProp({ title: '', address: '', price: 0, status: 'Vacío', type: 'Piso', notes: '', hasMortgage: false });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    updateProperty(selectedProperty);
    setViewMode('info');
  };

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    const tx: Transaction = {
      id: `tr${Date.now()}`,
      propertyId: selectedProperty.id,
      type: newTx.type as 'ingreso' | 'gasto',
      category: newTx.category || 'Otros',
      amount: Number(newTx.amount) || 0,
      date: newTx.date || '',
      description: newTx.description || '',
      document: newTx.document
    };
    addTransaction(tx);
    setNewTx({ type: 'gasto', category: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '', document: undefined });
  };

  const contract = selectedProperty ? contracts.find(c => c.propertyId === selectedProperty.id) : null;
  const contractTenants = contract ? contract.tenantIds.map(id => tenants.find(t => t.id === id)).filter(Boolean) : [];
  const propertyTxs = selectedProperty ? allTxs.filter(t => t.propertyId === selectedProperty.id) : [];
  const propertyIssues = selectedProperty ? issues.filter(i => i.propertyId === selectedProperty.id) : [];

  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState({ title: '', description: '', status: 'Abierta' as const, propertyId: '', cost: 0, generateTransaction: false });
  const [showIssueForm, setShowIssueForm] = useState(false);

  const handleSaveIssue = () => {
    if (!issueForm.title.trim() || !issueForm.propertyId) return;
    
    if (editingIssueId) {
      updateIssue({
        id: editingIssueId,
        propertyId: issueForm.propertyId,
        title: issueForm.title,
        description: issueForm.description,
        status: issueForm.status,
        createdAt: issues.find(i => i.id === editingIssueId)?.createdAt || new Date().toISOString().split('T')[0]
      });
    } else {
      addIssue({
        id: `iss${Date.now()}`,
        propertyId: issueForm.propertyId,
        title: issueForm.title,
        description: issueForm.description,
        status: issueForm.status,
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    
    // Auto-generate transaction if requested
    if (issueForm.status === 'Resuelta' && issueForm.generateTransaction && issueForm.cost > 0) {
      addTransaction({
        id: `tr${Date.now()}`,
        propertyId: issueForm.propertyId,
        type: 'gasto',
        category: 'Mantenimiento / Reparación',
        amount: Number(issueForm.cost) || 0,
        date: new Date().toISOString().split('T')[0],
        description: `[Resolución Incidencia] ${issueForm.title}`
      });
    }
    
    setShowIssueForm(false);
    setEditingIssueId(null);
    setIssueForm({ title: '', description: '', status: 'Abierta', propertyId: '', cost: 0, generateTransaction: false });
  };

  const handleEditIssue = (issue: any) => {
    setEditingIssueId(issue.id);
    setIssueForm({ title: issue.title, description: issue.description, status: issue.status, propertyId: issue.propertyId, cost: 0, generateTransaction: false });
    setShowIssueForm(true);
  };

  const handleDeleteIssue = () => {
    if (editingIssueId) {
      deleteIssue(editingIssueId);
      setShowIssueForm(false);
      setEditingIssueId(null);
    }
  };


  return (
    <div className="flex flex-col h-full relative">
      <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900 hidden sm:block">Portfolio</h1>
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar..."
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg w-full bg-slate-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center shadow-sm shrink-0"
          >
            <Plus size={20} className="sm:hidden" />
            <span className="hidden sm:inline">+ Añadir Inmueble</span>
          </button>
          
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-500" />
            )}
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 flex-1 overflow-auto">
        <div className="flex gap-1 sm:gap-2 mb-5 w-full bg-slate-100/50 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all
                ${activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
          {filteredProperties.map(p => {
            const hasIssues = issues.some(i => i.propertyId === p.id && i.status !== 'Resuelta');
            return (
            <div 
              key={p.id} 
              onClick={() => setSelectedProperty(p)}
              className={`bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer ${hasIssues ? 'border-red-300' : 'border-slate-200'}`}
            >
              <div className="h-44 relative bg-slate-100">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                {hasIssues && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white p-1.5 rounded-full shadow-md animate-pulse">
                    <AlertCircle size={14} strokeWidth={3} />
                  </div>
                )}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-semibold uppercase backdrop-blur-md shadow-sm
                  ${p.status === 'Ocupado' ? 'bg-white/90 text-slate-700' : 
                    p.status === 'Vacío' ? 'bg-emerald-500/90 text-white' : 
                    p.status === 'En Reforma' ? 'bg-amber-500/90 text-white' :
                    'bg-slate-800/90 text-white'}
                `}>
                  {p.status}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="font-semibold text-[16px] text-slate-900 leading-tight mb-1">{p.title}</div>
                <div className="text-slate-500 text-[13px] mb-4 line-clamp-1">{p.address}</div>
                
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Precio</div>
                    <span className="font-bold text-slate-900 text-[15px]">
                      {p.status === 'En Venta' ? (
                        <>{formatNumber(p.marketValue || p.price)} €</>
                      ) : (
                        <>{formatNumber(p.price)} €<span className="font-normal text-[11px] text-slate-500">/mes</span></>
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">Tipo</div>
                    <span className="font-semibold text-slate-700 text-[13px]">{p.type}</span>
                  </div>
                </div>
              </div>
            </div>
          );
          })}
          {filteredProperties.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              No se encontraron inmuebles para estos filtros.
            </div>
          )}
        </div>
      </div>

      {/* Drawer property details */}
      <div className={`absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${selectedProperty ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeProperty}>
        <div 
          className={`absolute inset-y-0 right-0 w-full sm:w-[360px] bg-white shadow-2xl transition-transform duration-300 transform flex flex-col ${selectedProperty ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          {selectedProperty && (
            <div className="flex flex-col h-full overflow-hidden">
               <div className="relative h-48 shrink-0 bg-slate-100">
                 <img src={selectedProperty.image} className="w-full h-full object-cover" />
                 <button onClick={closeProperty} className="absolute top-4 right-4 bg-white/80 hover:bg-white backdrop-blur p-2 rounded-full text-slate-900 shadow-sm transition-colors">
                   <X size={20} />
                 </button>
                 <div className="absolute bottom-4 left-4">
                   <span className="bg-white/95 shadow-sm backdrop-blur px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-slate-900">
                     {selectedProperty.status}
                   </span>
                 </div>
                 {viewMode === 'info' && (
                   <button 
                     onClick={() => setViewMode('edit')}
                     className="absolute bottom-4 right-4 bg-white/95 shadow-sm backdrop-blur px-3 py-1.5 rounded-full text-[12px] font-bold text-blue-600 flex items-center gap-1.5"
                   >
                     <Edit size={14} /> Modificar
                   </button>
                 )}
               </div>
               
               
               {['info', 'finanzas', 'mantenimiento'].includes(viewMode) && (
                 <div className="flex border-b border-slate-200 bg-white">
                   <button onClick={() => setViewMode('info')} className={`flex-1 py-3 text-[13px] ${viewMode === 'info' ? 'font-bold text-blue-600 border-b-2 border-blue-600' : 'font-semibold text-slate-500 hover:text-slate-700'}`}>Info</button>
                   <button onClick={() => setViewMode('finanzas')} className={`flex-1 py-3 text-[13px] ${viewMode === 'finanzas' ? 'font-bold text-blue-600 border-b-2 border-blue-600' : 'font-semibold text-slate-500 hover:text-slate-700'}`}>Finanzas</button>
                   <button onClick={() => setViewMode('mantenimiento')} className={`flex-1 py-3 text-[13px] ${viewMode === 'mantenimiento' ? 'font-bold text-blue-600 border-b-2 border-blue-600' : 'font-semibold text-slate-500 hover:text-slate-700'}`}>Mantenimiento</button>
                 </div>
               )}
               

               <div className="p-5 flex-1 overflow-auto bg-slate-50/50">
                  {viewMode === 'info' && (
                     <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                       <h2 className="text-[20px] font-bold text-slate-900 leading-tight">{selectedProperty.title}</h2>
                       <p className="text-slate-500 text-[14px] mt-1 mb-6">
                         {selectedProperty.address}
                         {(selectedProperty.city || selectedProperty.zipCode || selectedProperty.province) && (
                            <span className="block text-[13px] mt-0.5">
                              {selectedProperty.zipCode} {selectedProperty.city} {selectedProperty.province ? `(${selectedProperty.province})` : ''}
                            </span>
                         )}
                       </p>
                       
                       <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1">
                             {selectedProperty.status === 'En Venta' ? 'Valor de Mercado' : 'Precio actual'}
                           </div>
                           <div className="font-bold text-[18px] text-slate-900">
                             {selectedProperty.status === 'En Venta' 
                               ? `${(selectedProperty.marketValue || 0).toLocaleString("es-ES")} €`
                               : `${formatNumber(selectedProperty.price)} €`}
                             {selectedProperty.status !== 'En Venta' && <span className="text-[12px] font-normal text-slate-500">/mes</span>}
                           </div>
                         </div>
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1">Tipología</div>
                           <div className="font-bold text-[18px] text-slate-900">{selectedProperty.type}</div>
                         </div>
                       </div>

                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                         <div className="text-[11px] text-slate-400 uppercase font-semibold mb-3">Características</div>
                         <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[13px]">
                           <div><span className="text-slate-500 block mb-0.5">Superficie</span> <span className="font-medium text-slate-900">{selectedProperty.sqm || '-'} m²</span></div>
                           <div><span className="text-slate-500 block mb-0.5">Habitaciones</span> <span className="font-medium text-slate-900">{selectedProperty.rooms || '-'}</span></div>
                           <div className="col-span-2"><span className="text-slate-500 block mb-0.5">Ref. Catastral</span> <span className="font-medium text-slate-900 break-all">{selectedProperty.cadastralReference || '-'}</span></div>
                         </div>
                       </div>

                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                         <div className="text-[11px] text-slate-400 uppercase font-semibold mb-3">Datos Económicos Adquisición</div>
                         <div className="space-y-3 text-[13px]">
                           <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Fecha de compra</span> <span className="font-medium text-slate-900">{selectedProperty.purchaseDate ? formatDate(selectedProperty.purchaseDate) : '-'}</span></div>
                           <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Valor de compra</span> <span className="font-medium text-slate-900">{selectedProperty.purchasePrice ? `${formatNumber(selectedProperty.purchasePrice)} €` : '-'}</span></div>
                           <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Entrada aportada</span> <span className="font-medium text-slate-900">{selectedProperty.downPayment ? `${formatNumber(selectedProperty.downPayment)} €` : '-'}</span></div>
                           <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Gastos adquisición</span> <span className="font-medium text-slate-900">{selectedProperty.purchaseExpenses ? `${formatNumber(selectedProperty.purchaseExpenses)} €` : '-'}</span></div>
                           <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Gastos de reforma</span> <span className="font-medium text-slate-900">{selectedProperty.renovationExpenses ? `${formatNumber(selectedProperty.renovationExpenses)} €` : '-'}</span></div>
                           <div className="flex justify-between pt-1"><span className="text-slate-500">Hipoteca</span> 
                             <span className="font-medium text-slate-900">
                               {selectedProperty.hasMortgage ? `Sí, cuota: ${formatNumber(selectedProperty.mortgageInstallment || 0)} €/mes` : 'No'}
                             </span>
                           </div>
                         </div>
                       </div>

                       {(selectedProperty.purchaseDocumentUrl || selectedProperty.mortgageDocumentUrl || selectedProperty.rentalContractUrl) && (
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold mb-3">Documentos Adjuntos</div>
                           <div className="space-y-3 text-[13px]">
                             {selectedProperty.rentalContractUrl && (
                               <a href={selectedProperty.rentalContractUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 font-medium hover:underline p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                 <FileText size={16} className="text-blue-500" /> Contrato de Alquiler
                               </a>
                             )}
                             {selectedProperty.purchaseDocumentUrl && (
                               <a href={selectedProperty.purchaseDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-700 font-medium hover:underline p-2 bg-slate-50 rounded-lg border border-slate-200">
                                 <FileText size={16} className="text-slate-400" /> Documento de Compra
                               </a>
                             )}
                             {selectedProperty.mortgageDocumentUrl && (
                               <a href={selectedProperty.mortgageDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-700 font-medium hover:underline p-2 bg-slate-50 rounded-lg border border-slate-200">
                                 <FileText size={16} className="text-slate-400" /> Documento de Hipoteca
                               </a>
                             )}
                           </div>
                         </div>
                       )}

                       <div className="mb-6">
                         <div className="flex items-center justify-between mb-3">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold">Incidencias y Alertas</div>
                           <button 
                             onClick={() => {
                               setEditingIssueId(null);
                               setIssueForm({ title: '', description: '', status: 'Abierta', propertyId: selectedProperty.id });
                               setShowIssueForm(true);
                             }}
                             className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                           >
                             + Añadir Incidencia
                           </button>
                         </div>
                         {propertyIssues.length === 0 ? (
                           <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center text-slate-400 text-sm">
                             No hay incidencias registradas
                           </div>
                         ) : (
                           <div className="space-y-3">
                             {propertyIssues.map(issue => (
                               <div key={issue.id} onClick={() => handleEditIssue(issue)} className="bg-white border border-red-200 shadow-sm p-4 rounded-xl relative hover:border-red-300 transition-colors cursor-pointer group">
                                 <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{issue.title}</h4>
                                 </div>
                                 <p className="text-xs text-slate-600 leading-relaxed mb-3">{issue.description}</p>
                                 <div className="flex items-center justify-between text-[11px] font-semibold">
                                   <span className="text-slate-400">{formatDate(issue.createdAt)}</span>
                                   <span className={`px-2 py-1 rounded-full ${issue.status === 'Resuelta' ? 'bg-emerald-100 text-emerald-700' : issue.status === 'En Progreso' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                     {issue.status}
                                   </span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>

                       {selectedProperty.notes && (
                         <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl mb-6">
                           <div className="text-[11px] text-amber-700 uppercase font-bold mb-1">Notas e Información adicional</div>
                           <p className="text-[13px] text-amber-900 leading-relaxed">{selectedProperty.notes}</p>
                         </div>
                       )}
                       
                       {contract ? (
                         <button 
                           onClick={() => setViewMode('contract')} 
                           className="w-full bg-slate-900 hover:bg-slate-800 transition-colors text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm text-[14px]"
                         >
                           <FileText size={18} /> Ver Contrato Activo
                         </button>
                       ) : (
                         <div className="bg-slate-100 p-4 rounded-xl text-center text-slate-500 text-[13px] border border-slate-200">
                           No hay contratos activos para este inmueble.
                         </div>
                       )}
                     </div>
                  )}

                  
                  {viewMode === 'mantenimiento' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><AlertTriangle size={20} className="text-amber-500"/> Mantenimiento y Alertas</h3>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col items-center justify-center text-center">
                          <p className="text-sm text-slate-500 mb-4 max-w-sm">
                            Gestiona las incidencias, reparaciones o alertas vinculadas a este inmueble. Al resolverlas, podrás generar un gasto automáticamente.
                          </p>
                          <button 
                             onClick={() => {
                               setIssueForm({ title: '', description: '', status: 'Abierta', propertyId: selectedProperty.id, cost: 0, generateTransaction: false });
                               setEditingIssueId(null);
                               setShowIssueForm(true);
                             }}
                             className="px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg shadow-sm hover:bg-slate-800 flex items-center gap-2"
                           >
                             <Plus size={16} /> Registrar Nueva Incidencia
                           </button>
                        </div>
                        
                        {propertyIssues.length === 0 ? (
                           <div className="bg-slate-50 border border-slate-100 p-8 rounded-xl text-center text-slate-400 text-sm">
                             <CheckCircle size={32} className="mx-auto mb-3 text-slate-300" />
                             Todo perfecto. No hay incidencias registradas en este momento.
                           </div>
                         ) : (
                           <div className="space-y-4">
                             {propertyIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(issue => (
                               <div key={issue.id} onClick={() => handleEditIssue(issue)} className={`bg-white border shadow-sm p-4 rounded-xl relative transition-colors cursor-pointer group ${issue.status === 'Resuelta' ? 'border-slate-200 hover:border-slate-300' : 'border-amber-200 hover:border-amber-300'}`}>
                                 <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                     {issue.status === 'Resuelta' ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500"/>}
                                     {issue.title}
                                   </h4>
                                 </div>
                                 <p className="text-sm text-slate-600 leading-relaxed mb-4">{issue.description}</p>
                                 <div className="flex items-center justify-between text-[11px] font-semibold border-t border-slate-100 pt-3">
                                   <span className="text-slate-400">Fecha reporte: {formatDate(issue.createdAt)}</span>
                                   <span className={`px-3 py-1 rounded-full ${issue.status === 'Resuelta' ? 'bg-emerald-100 text-emerald-700' : issue.status === 'En Progreso' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                     {issue.status}
                                   </span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                     </div>
                  )}

                  {viewMode === 'finanzas' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-slate-900 text-lg">Finanzas del Inmueble</h3>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Registrar Gasto/Ingreso</h4>
                          <form onSubmit={handleAddTx} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <select className="border border-slate-200 rounded p-2 text-sm bg-slate-50" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value as 'ingreso'|'gasto'})} required>
                                <option value="gasto">Gasto</option>
                                <option value="ingreso">Ingreso</option>
                              </select>
                              <input type="number" placeholder="Importe (€)" className="border border-slate-200 rounded p-2 text-sm bg-slate-50" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" placeholder="Categoría (Ej: IBI)" className="border border-slate-200 rounded p-2 text-sm bg-slate-50" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} required />
                              <input type="date" className="border border-slate-200 rounded p-2 text-sm bg-slate-50" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} required />
                            </div>
                            <input type="text" placeholder="Descripción" className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} required />
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Documento / Factura (Opcional)</label>
                              <input 
                                type="file" 
                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded p-2 bg-slate-50"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setNewTx({...newTx, document: event.target.result as string});
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div>
                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                              Guardar Registro
                            </button>
                          </form>
                        </div>
                        
                        {(() => {
                          if (selectedProperty.status === 'En Venta') {
                            const marketValue = selectedProperty.marketValue || 0;
                            const purchasePrice = selectedProperty.purchasePrice || 0;
                            const downPayment = selectedProperty.downPayment || 0;
                            const purchaseExpenses = selectedProperty.purchaseExpenses || 0;
                            const renovationExpenses = selectedProperty.renovationExpenses || 0;
                            
                            const totalInvested = downPayment + purchaseExpenses + renovationExpenses;
                            const totalCost = purchasePrice + purchaseExpenses + renovationExpenses;
                            const potentialProfit = marketValue - totalCost;
                            const roi = totalInvested > 0 ? (potentialProfit / totalInvested) * 100 : 0;

                            return (
                              <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Inversión Inicial</span>
                                  <span className="text-xl font-bold text-slate-900">{formatNumber(totalInvested)} €</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Coste Total Adquisición</span>
                                  <span className="text-xl font-bold text-slate-900">{formatNumber(totalCost)} €</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Beneficio Potencial</span>
                                  <span className={`text-xl font-bold ${potentialProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {potentialProfit > 0 ? '+' : ''}{formatNumber(potentialProfit)} €
                                  </span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">ROI (Sobre Inversión)</span>
                                  <span className={`text-xl font-bold ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatNumber(roi, 2)}%
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          const monthlyRent = selectedProperty.price || 0;
                          const annualRent = monthlyRent * 12;
                          const purchasePrice = selectedProperty.purchasePrice || 1;
                          
                          const commMonthly = selectedProperty.communityFees || 0;
                          const ibiMonthly = (selectedProperty.ibi || 0) / 12;
                          const mortgageMonthly = selectedProperty.hasMortgage ? (selectedProperty.mortgageInstallment || 0) : 0;
                          
                          const totalAnnualExpenses = (commMonthly + ibiMonthly) * 12;
                          
                          const grossYield = purchasePrice > 1 ? (annualRent / purchasePrice) * 100 : 0;
                          const netYield = purchasePrice > 1 ? ((annualRent - totalAnnualExpenses) / purchasePrice) * 100 : 0;
                          
                          const cashFlow = monthlyRent - commMonthly - ibiMonthly - mortgageMonthly;
                          const per = annualRent > 0 ? (purchasePrice / annualRent) : 0;

                          return (
                            <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Rentabilidad Bruta</span>
                                <span className="text-xl font-bold text-slate-900">{formatNumber(grossYield, 2)}%</span>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Rentabilidad Neta</span>
                                <span className="text-xl font-bold text-emerald-600">{formatNumber(netYield, 2)}%</span>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Flujo de Caja</span>
                                <span className={`text-xl font-bold ${cashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {cashFlow > 0 ? '+' : ''}{formatNumber(cashFlow, 0)} €<span className="text-[12px] font-normal text-slate-500">/mes</span>
                                </span>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">PER</span>
                                <span className="text-xl font-bold text-slate-900">{per > 0 ? per.toFixed(1) : '-'} <span className="text-[12px] font-normal text-slate-500">años</span></span>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Historial</h4>
                          {propertyTxs.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-500 bg-white border border-slate-200 rounded-xl">No hay registros financieros.</div>
                          ) : (
                            propertyTxs.map(tx => (
                              <div key={tx.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'ingreso' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {tx.type === 'ingreso' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 text-[14px] leading-tight flex items-center gap-1.5">
                                      {tx.category}
                                      {tx.document && (
                                        <a href={tx.document} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600" title="Ver documento">
                                          <Paperclip size={12} />
                                        </a>
                                      )}
                                    </div>
                                    <div className="text-slate-500 text-[12px]">{formatDate(tx.date)}</div>
                                  </div>
                                </div>
                                <div className={`font-bold ${tx.type === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {tx.type === 'ingreso' ? '+' : '-'}{formatNumber(tx.amount)} €
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                     </div>
                  )}

                  {viewMode === 'edit' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                       <button onClick={() => setViewMode('info')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold mb-5 text-[14px]">
                         <ChevronLeft size={18} /> Cancelar edición
                       </button>
                       
                       <form id="edit-property-form" onSubmit={handleUpdate} className="flex-1 overflow-y-auto">
                          <PropertyFields data={selectedProperty} onChange={(d) => setSelectedProperty(d as Property)} />
                       </form>
                       <div className="pt-4 border-t border-slate-200 mt-4 shrink-0">
                         <button type="submit" form="edit-property-form" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white py-3 rounded-xl font-semibold text-sm shadow-sm">
                           Guardar Cambios
                         </button>
                       </div>
                     </div>
                  )}

                  {viewMode === 'contract' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                       <button onClick={() => setViewMode('info')} className="flex items-center gap-1.5 text-blue-500 hover:text-blue-600 font-semibold mb-6 text-[14px]">
                         <ChevronLeft size={18} /> Volver al inmueble
                       </button>
                       <h3 className="text-[18px] font-bold text-slate-900 mb-5">Detalles del Contrato</h3>
                       
                       <div className="space-y-4 flex-1">
                         <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <div className="text-[11px] text-slate-400 font-semibold uppercase mb-3 tracking-wider">Inquilinos ({contractTenants.length})</div>
                            {contractTenants.length > 0 ? (
                              <div className="space-y-3">
                                {contractTenants.map((t, idx) => t && (
                                  <div key={t.id} className={`flex flex-col gap-1 ${idx > 0 ? 'pt-3 border-t border-slate-100' : ''}`}>
                                    <div className="font-bold text-[14px] text-slate-900">{t.name}</div>
                                    <div className="text-[12px] text-slate-500">{t.email}</div>
                                    <div className="text-[12px] text-slate-500">{t.phone}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500">Sin información</div>
                            )}
                         </div>
                         
                         <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <div className="text-[11px] text-slate-400 font-semibold uppercase mb-3">Condiciones</div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                              <span className="text-[13px] text-slate-500">Renta Mensual</span>
                              <span className="font-semibold text-slate-900">{formatNumber(contract?.rentAmount)} €</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[13px] text-slate-500">Fianza Depositada</span>
                              <span className="font-semibold text-slate-900">{formatNumber(contract?.deposit)} €</span>
                            </div>
                         </div>

                         <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <div className="text-[11px] text-slate-400 font-semibold uppercase mb-3">Vigencia</div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                              <span className="text-[13px] text-slate-500">Fecha Inicio</span>
                              <span className="font-medium text-slate-900">{contract?.startDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[13px] text-slate-500">Fecha Fin</span>
                              <span className="font-medium text-slate-900">{contract?.endDate}</span>
                            </div>
                         </div>
                       </div>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-[18px] font-bold text-slate-900">Añadir Inmueble</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
              <form id="add-property-form" onSubmit={handleAdd}>
                <PropertyFields data={newProp} onChange={setNewProp} />
              </form>
            </div>
            <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold text-sm hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" form="add-property-form" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg shadow-sm">Guardar Inmueble</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Incidencia */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setShowIssueForm(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
              <h2 className="text-[18px] font-bold text-slate-900">{editingIssueId ? 'Editar Incidencia' : 'Añadir Incidencia'}</h2>
              <button onClick={() => setShowIssueForm(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Título de la alerta</label>
                <input 
                  type="text" 
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({...issueForm, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-500 outline-none"
                  placeholder="Ej. Limpieza general necesaria"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Inmueble Asignado</label>
                <select
                  value={issueForm.propertyId}
                  onChange={(e) => setIssueForm({...issueForm, propertyId: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Puedes reasignar la alerta a otro activo como precaución.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descripción</label>
                <textarea 
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-500 outline-none min-h-[100px] resize-none"
                  placeholder="Detalles sobre la incidencia..."
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setIssueForm({...issueForm, status: 'Abierta'})}
                    className={`py-2 text-xs font-semibold rounded-lg border ${issueForm.status === 'Abierta' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    Abierta
                  </button>
                  <button 
                    onClick={() => setIssueForm({...issueForm, status: 'En Progreso'})}
                    className={`py-2 text-xs font-semibold rounded-lg border ${issueForm.status === 'En Progreso' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    En Progreso
                  </button>
                  <button 
                    onClick={() => setIssueForm({...issueForm, status: 'Resuelta'})}
                    className={`py-2 text-xs font-semibold rounded-lg border ${issueForm.status === 'Resuelta' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    Resuelta
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 bg-white flex justify-between gap-3 shrink-0 rounded-b-2xl">
              {editingIssueId ? (
                <button type="button" onClick={handleDeleteIssue} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Alerta">
                  <Trash2 size={20} />
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowIssueForm(false)} className="px-4 py-2 text-slate-600 font-semibold text-sm hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={handleSaveIssue} disabled={!issueForm.title.trim()} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-50">Guardar Incidencia</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
