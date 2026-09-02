import React, { useState, useEffect } from 'react';
import { PropertyStatus, Property, Transaction } from '../types';
import { Search, AlertTriangle, CheckCircle, ChevronLeft, FileText, X, Edit, Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle, Trash2, Upload, Download, Paperclip , Eye} from 'lucide-react';
import { useAppContext } from '../store';
import PropertyFields from './PropertyFields';
import { formatDate, formatNumber } from '../utils';
import SettingsModal from './SettingsModal';
import { User } from 'lucide-react';
import FormattedNumberInput from './FormattedNumberInput';

import { DocumentViewerModal } from './DocumentViewerModal';
import { DocumentActionButtons } from './DocumentActionButtons';

export default function PortfolioView({ initialTab = 'Todos' }: { initialTab?: PropertyStatus | 'Todos' }) {
  const { properties, setProperties, addProperty, updateProperty, contracts, tenants, getDynamicTransactions, addTransaction, issues, addIssue, updateIssue, deleteIssue, language, userName, avatarUrl } = useAppContext();
  const isEs = language === 'Español';
  const allTxs = getDynamicTransactions();
  const [activeTab, setActiveTab] = useState<PropertyStatus | 'Todos'>(initialTab);
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [viewMode, setViewMode] = useState<'info' | 'contract' | 'edit' | 'finanzas'>('info');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);
  const [newProp, setNewProp] = useState<Partial<Property>>({
    title: '', address: '', price: 0, status: 'Vacío', type: 'Piso', notes: ''
  });

  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'gasto', category: '', amount: 0, date: new Date().toISOString().split('T')[0], description: ''
  });

  const tabKeys: (PropertyStatus | 'Todos')[] = ['Todos', 'Ocupado', 'Vacío', 'En Reforma', 'En Venta'];

  const getTabLabel = (tab: PropertyStatus | 'Todos') => {
    if (tab === 'Todos') return isEs ? 'Todos' : 'All';
    if (tab === 'Ocupado') return isEs ? 'Ocupado' : 'Occupied';
    if (tab === 'Vacío') return isEs ? 'Vacío' : 'Vacant';
    if (tab === 'En Reforma') return isEs ? 'En Reforma' : 'Under Renovation';
    if (tab === 'En Venta') return isEs ? 'En Venta' : 'For Sale';
    return tab;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'Ocupado') return isEs ? 'Ocupado' : 'Occupied';
    if (status === 'Vacío') return isEs ? 'Vacío' : 'Vacant';
    if (status === 'En Reforma') return isEs ? 'En Reforma' : 'Under Renovation';
    if (status === 'En Venta') return isEs ? 'En Venta' : 'For Sale';
    return status;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'Local') return isEs ? 'Local' : 'Commercial';
    if (type === 'Garaje') return isEs ? 'Garaje' : 'Garage';
    if (type === 'Trastero') return isEs ? 'Trastero' : 'Storage';
    if (type === 'Casa') return isEs ? 'Casa' : 'House';
    if (type === 'Piso') return isEs ? 'Piso' : 'Apartment';
    if (type === 'Edificio') return isEs ? 'Edificio' : 'Building';
    return type;
  };

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
    const property: Omit<Property, 'id'> = {
      title: newProp.title || '',
      address: newProp.address || '',
      zipCode: newProp.zipCode || '',
      city: newProp.city || '',
      province: newProp.province || '',
      price: Math.max(0, Number(newProp.price) || 0),
      marketValue: Math.max(0, Number(newProp.marketValue) || 0),
      status: (newProp.status as PropertyStatus) || 'Vacío',
      type: newProp.type || 'Piso',
      notes: newProp.notes || '',
      sqm: Math.max(0, Number(newProp.sqm) || 0),
      rooms: Math.max(0, Math.floor(Number(newProp.rooms) || 0)),
      cadastralReference: newProp.cadastralReference || '',
      purchaseDate: newProp.purchaseDate || '',
      purchasePrice: Math.max(0, Number(newProp.purchasePrice) || 0),
      downPayment: Math.max(0, Number(newProp.downPayment) || 0),
      purchaseExpenses: Math.max(0, Number(newProp.purchaseExpenses) || 0),
      renovationExpenses: Math.max(0, Number(newProp.renovationExpenses) || 0),
      hasMortgage: newProp.hasMortgage || false,
      mortgageInstallment: Math.max(0, Number(newProp.mortgageInstallment) || 0),
      communityFees: Math.max(0, Number(newProp.communityFees) || 0),
      ibi: Math.max(0, Number(newProp.ibi) || 0),
      image: newProp.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60'
    };
    addProperty(property);
    setIsModalOpen(false);
    setNewProp({ title: '', address: '', price: 0, status: 'Vacío', type: 'Piso', notes: '', hasMortgage: false });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    const sanitized: Property = {
      ...selectedProperty,
      price: Math.max(0, Number(selectedProperty.price) || 0),
      marketValue: selectedProperty.marketValue !== undefined ? Math.max(0, Number(selectedProperty.marketValue) || 0) : undefined,
      sqm: selectedProperty.sqm !== undefined ? Math.max(0, Number(selectedProperty.sqm) || 0) : undefined,
      rooms: selectedProperty.rooms !== undefined ? Math.max(0, Math.floor(Number(selectedProperty.rooms) || 0)) : undefined,
      purchasePrice: selectedProperty.purchasePrice !== undefined ? Math.max(0, Number(selectedProperty.purchasePrice) || 0) : undefined,
      downPayment: selectedProperty.downPayment !== undefined ? Math.max(0, Number(selectedProperty.downPayment) || 0) : undefined,
      purchaseExpenses: selectedProperty.purchaseExpenses !== undefined ? Math.max(0, Number(selectedProperty.purchaseExpenses) || 0) : undefined,
      renovationExpenses: selectedProperty.renovationExpenses !== undefined ? Math.max(0, Number(selectedProperty.renovationExpenses) || 0) : undefined,
      mortgageInstallment: selectedProperty.mortgageInstallment !== undefined ? Math.max(0, Number(selectedProperty.mortgageInstallment) || 0) : undefined,
      communityFees: selectedProperty.communityFees !== undefined ? Math.max(0, Number(selectedProperty.communityFees) || 0) : undefined,
      ibi: selectedProperty.ibi !== undefined ? Math.max(0, Number(selectedProperty.ibi) || 0) : undefined,
    };
    updateProperty(sanitized);
    setSelectedProperty(sanitized);
    setViewMode('info');
  };

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    const tx: Omit<Transaction, 'id'> = {
      propertyId: selectedProperty.id,
      type: newTx.type as 'ingreso' | 'gasto',
      category: newTx.category || (isEs ? 'Otros' : 'Other'),
      amount: Math.max(0, Number(newTx.amount) || 0),
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
        propertyId: issueForm.propertyId,
        title: issueForm.title,
        description: issueForm.description,
        status: issueForm.status,
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    
    const sanitizedCost = Math.max(0, Number(issueForm.cost) || 0);
    // Auto-generate transaction if requested
    if (issueForm.status === 'Resuelta' && issueForm.generateTransaction && sanitizedCost > 0) {
      addTransaction({
        propertyId: issueForm.propertyId,
        type: 'gasto',
        category: isEs ? 'Mantenimiento / Reparación' : 'Maintenance / Repair',
        amount: sanitizedCost,
        date: new Date().toISOString().split('T')[0],
        description: `[${isEs ? 'Resolución Incidencia' : 'Issue Resolution'}] ${issueForm.title}`
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
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="min-h-[64px] py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900 dark:text-white hidden sm:block">{isEs ? 'Portfolio' : 'Portfolio'}</h1>
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder={isEs ? "Buscar..." : "Search..."}
            className="pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <span className="hidden sm:inline">{isEs ? '+ Añadir Inmueble' : '+ Add Property'}</span>
          </button>
          
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-500 dark:text-slate-300" />
            )}
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 flex-1 overflow-auto">
        <div className="flex gap-1 sm:gap-2 mb-5 w-full bg-slate-100/50 dark:bg-slate-800/60 p-1 rounded-xl">
          {tabKeys.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all
                ${activeTab === tab 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
            >
              {getTabLabel(tab)}
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
              className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer ${hasIssues ? 'border-red-300 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <div className="h-44 relative bg-slate-100 dark:bg-slate-700">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                {hasIssues && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white p-1.5 rounded-full shadow-md animate-pulse">
                    <AlertCircle size={14} strokeWidth={3} />
                  </div>
                )}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-semibold uppercase backdrop-blur-md shadow-sm
                  ${p.status === 'Ocupado' ? 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200' : 
                    p.status === 'Vacío' ? 'bg-emerald-500/90 text-white' : 
                    p.status === 'En Reforma' ? 'bg-amber-500/90 text-white' :
                    'bg-slate-800/90 text-white'}
                `}>
                  {getStatusLabel(p.status)}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="font-semibold text-[16px] text-slate-900 dark:text-white leading-tight mb-1">{p.title}</div>
                <div className="text-slate-500 dark:text-slate-400 text-[13px] mb-4 line-clamp-1">{p.address}</div>
                
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">{isEs ? 'Precio' : 'Price'}</div>
                    <span className="font-bold text-slate-900 dark:text-white text-[15px]">
                      {p.status === 'En Venta' ? (
                        <>{formatNumber(p.marketValue || p.price)} €</>
                      ) : (
                        <>{formatNumber(p.price)} €<span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">{isEs ? '/mes' : '/mo'}</span></>
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">{isEs ? 'Tipo' : 'Type'}</div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[13px]">{getTypeLabel(p.type)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
          })}
          {filteredProperties.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {isEs ? 'No se encontraron inmuebles para estos filtros.' : 'No properties found for the selected filters.'}
            </div>
          )}
        </div>
      </div>

      {/* Drawer property details */}
      <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${selectedProperty ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeProperty}>
        <div 
          className={`absolute inset-y-0 right-0 w-full sm:w-[380px] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 transform flex flex-col ${selectedProperty ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          {selectedProperty && (
            <div className="flex flex-col h-full overflow-hidden">
               <div className="relative h-48 shrink-0 bg-slate-100 dark:bg-slate-800">
                 <img src={selectedProperty.image} className="w-full h-full object-cover" />
                 <button onClick={closeProperty} className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur p-2 rounded-full text-slate-900 dark:text-white shadow-sm transition-colors">
                   <X size={20} />
                 </button>
                 <div className="absolute bottom-4 left-4">
                   <span className="bg-white/95 dark:bg-slate-800/95 shadow-sm backdrop-blur px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                     {getStatusLabel(selectedProperty.status)}
                   </span>
                 </div>
                 {viewMode === 'info' && (
                   <button 
                     onClick={() => setViewMode('edit')}
                     className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-800/95 shadow-sm backdrop-blur px-3 py-1.5 rounded-full text-[12px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5"
                   >
                     <Edit size={14} /> {isEs ? 'Modificar' : 'Edit'}
                   </button>
                 )}
               </div>
               
               {['info', 'finanzas'].includes(viewMode) && (
                 <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                   <button onClick={() => setViewMode('info')} className={`flex-1 py-3 text-[13px] ${viewMode === 'info' ? 'font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>{isEs ? 'Info' : 'Info'}</button>
                   <button onClick={() => setViewMode('finanzas')} className={`flex-1 py-3 text-[13px] ${viewMode === 'finanzas' ? 'font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>{isEs ? 'Finanzas' : 'Finances'}</button>
                 </div>
               )}

               <div className="p-5 flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50">
                  {viewMode === 'info' && (
                     <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                       <h2 className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight">{selectedProperty.title}</h2>
                       <p className="text-slate-500 dark:text-slate-400 text-[14px] mt-1 mb-6">
                         {selectedProperty.address}
                         {(selectedProperty.city || selectedProperty.zipCode || selectedProperty.province) && (
                            <span className="block text-[13px] mt-0.5">
                              {selectedProperty.zipCode} {selectedProperty.city} {selectedProperty.province ? `(${selectedProperty.province})` : ''}
                            </span>
                         )}
                       </p>
                       
                       <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1">
                             {selectedProperty.status === 'En Venta' ? (isEs ? 'Valor de Mercado' : 'Market Value') : (isEs ? 'Precio actual' : 'Current Price')}
                           </div>
                           <div className="font-bold text-[18px] text-slate-900 dark:text-white">
                             {selectedProperty.status === 'En Venta' 
                               ? `${formatNumber(selectedProperty.marketValue || 0)} €`
                               : `${formatNumber(selectedProperty.price)} €`}
                             {selectedProperty.status !== 'En Venta' && <span className="text-[12px] font-normal text-slate-500 dark:text-slate-400">{isEs ? '/mes' : '/mo'}</span>}
                           </div>
                         </div>
                         <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1">{isEs ? 'Tipología' : 'Type'}</div>
                           <div className="font-bold text-[18px] text-slate-900 dark:text-white">{getTypeLabel(selectedProperty.type)}</div>
                         </div>
                       </div>

                       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
                         <div className="text-[11px] text-slate-400 uppercase font-semibold mb-3">{isEs ? 'Características' : 'Features'}</div>
                         <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[13px]">
                           <div><span className="text-slate-500 dark:text-slate-400 block mb-0.5">{isEs ? 'Superficie' : 'Square Meters'}</span> <span className="font-medium text-slate-900 dark:text-white">{selectedProperty.sqm || '-'} m²</span></div>
                           <div><span className="text-slate-500 dark:text-slate-400 block mb-0.5">{isEs ? 'Habitaciones' : 'Bedrooms'}</span> <span className="font-medium text-slate-900 dark:text-white">{selectedProperty.rooms || '-'}</span></div>
                           <div className="col-span-2"><span className="text-slate-500 dark:text-slate-400 block mb-0.5">{isEs ? 'Ref. Catastral' : 'Cadastral Ref.'}</span> <span className="font-medium text-slate-900 dark:text-white break-all">{selectedProperty.cadastralReference || '-'}</span></div>
                         </div>
                       </div>

                       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                         <div className="text-[11px] text-slate-400 uppercase font-semibold mb-3">{isEs ? 'Datos Económicos Adquisición' : 'Acquisition Financials'}</div>
                         <div className="space-y-3 text-[13px]">
                           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">{isEs ? 'Fecha de compra' : 'Purchase Date'}</span> <span className="font-medium text-slate-900 dark:text-white">{selectedProperty.purchaseDate ? formatDate(selectedProperty.purchaseDate) : '-'}</span></div>
                           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">{isEs ? 'Valor de compra' : 'Purchase Price'}</span> <span className="font-medium text-slate-900 dark:text-white">{selectedProperty.purchasePrice ? `${formatNumber(selectedProperty.purchasePrice)} €` : '-'}</span></div>
                           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">{isEs ? 'Entrada aportada' : 'Down Payment'}</span> <span className="font-medium text-slate-900 dark:text-white">{selectedProperty.downPayment ? `${formatNumber(selectedProperty.downPayment)} €` : '-'}</span></div>
                           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">{isEs ? 'Gastos adquisición' : 'Acquisition Expenses'}</span> <span className="font-medium text-slate-900 dark:text-white">{selectedProperty.purchaseExpenses ? `${formatNumber(selectedProperty.purchaseExpenses)} €` : '-'}</span></div>
                           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400">{isEs ? 'Gastos de reforma' : 'Renovation Expenses'}</span> <span className="font-medium text-slate-900 dark:text-white">{selectedProperty.renovationExpenses ? `${formatNumber(selectedProperty.renovationExpenses)} €` : '-'}</span></div>
                           <div className="flex justify-between pt-1"><span className="text-slate-500 dark:text-slate-400">{isEs ? 'Hipoteca' : 'Mortgage'}</span> 
                             <span className="font-medium text-slate-900 dark:text-white">
                               {selectedProperty.hasMortgage ? `${isEs ? 'Sí, cuota:' : 'Yes, installment:'} ${formatNumber(selectedProperty.mortgageInstallment || 0)} €/${isEs ? 'mes' : 'mo'}` : (isEs ? 'No' : 'No')}
                             </span>
                           </div>
                         </div>
                       </div>

                       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
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
                                 <DocumentActionButtons 
                                     onView={() => setViewingDoc({ url: selectedProperty.rentalContractUrl!, name: 'Contrato Alquiler' })}
                                     downloadUrl={selectedProperty.rentalContractUrl!}
                                     downloadName="Contrato_Alquiler"
                                     onDelete={() => {
                                        if(confirm(isEs ? '¿Eliminar documento?' : 'Delete document?')) {
                                          const updated = { ...selectedProperty, rentalContractUrl: '' };
                                          setSelectedProperty(updated);
                                          updateProperty(updated);
                                        }
                                     }}
                                     onDownload={() => {}}
                                   />
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
                                 <DocumentActionButtons 
                                     onView={() => setViewingDoc({ url: selectedProperty.purchaseDocumentUrl!, name: 'Documento Compra' })}
                                     downloadUrl={selectedProperty.purchaseDocumentUrl!}
                                     downloadName="Documento_Compra"
                                     onDelete={() => {
                                        if(confirm(isEs ? '¿Eliminar documento?' : 'Delete document?')) {
                                          const updated = { ...selectedProperty, purchaseDocumentUrl: '' };
                                          setSelectedProperty(updated);
                                          updateProperty(updated);
                                        }
                                     }}
                                     onDownload={() => {}}
                                   />
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
                         </div>

                       <div className="mb-6">
                         <div className="flex items-center justify-between mb-3">
                           <div className="text-[11px] text-slate-400 uppercase font-semibold">{isEs ? 'Incidencias y Alertas' : 'Issues & Alerts'}</div>
                           <button 
                             onClick={() => {
                               setEditingIssueId(null);
                               setIssueForm({ title: '', description: '', status: 'Abierta', propertyId: selectedProperty.id, cost: 0, generateTransaction: false });
                               setShowIssueForm(true);
                             }}
                             className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                           >
                             {isEs ? '+ Añadir Incidencia' : '+ Add Issue'}
                           </button>
                         </div>
                         {propertyIssues.length === 0 ? (
                           <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl text-center text-slate-400 text-sm">
                             {isEs ? 'No hay incidencias registradas' : 'No issues registered'}
                           </div>
                         ) : (
                           <div className="space-y-3">
                             {propertyIssues.map(issue => (
                               <div key={issue.id} onClick={() => handleEditIssue(issue)} className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/40 shadow-sm p-4 rounded-xl relative hover:border-red-300 dark:hover:border-red-700 transition-colors cursor-pointer group">
                                 <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{issue.title}</h4>
                                 </div>
                                 <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{issue.description}</p>
                                 <div className="flex items-center justify-between text-[11px] font-semibold">
                                   <span className="text-slate-400">{formatDate(issue.createdAt)}</span>
                                   <span className={`px-2 py-1 rounded-full ${issue.status === 'Resuelta' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : issue.status === 'En Progreso' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'}`}>
                                     {issue.status === 'Resuelta' ? (isEs ? 'Resuelta' : 'Resolved') : issue.status === 'En Progreso' ? (isEs ? 'En Progreso' : 'In Progress') : (isEs ? 'Abierta' : 'Open')}
                                   </span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>

                       {selectedProperty.notes && (
                         <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-xl mb-6">
                           <div className="text-[11px] text-amber-700 dark:text-amber-400 uppercase font-bold mb-1">{isEs ? 'Notas e Información adicional' : 'Notes & Additional Info'}</div>
                           <p className="text-[13px] text-amber-900 dark:text-amber-200 leading-relaxed">{selectedProperty.notes}</p>
                         </div>
                       )}
                       
                       {contract ? (
                         <button 
                           onClick={() => setViewMode('contract')} 
                           className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm text-[14px]"
                         >
                           <FileText size={18} /> {isEs ? 'Ver Contrato Activo' : 'View Active Contract'}
                         </button>
                       ) : (
                         <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-center text-slate-500 dark:text-slate-400 text-[13px] border border-slate-200 dark:border-slate-700">
                           {isEs ? 'No hay contratos activos para este inmueble.' : 'No active contracts for this property.'}
                         </div>
                       )}
                     </div>
                  )}



                  {viewMode === 'finanzas' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{isEs ? 'Finanzas del Inmueble' : 'Property Financials'}</h3>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">{isEs ? 'Registrar Gasto/Ingreso' : 'Record Expense/Income'}</h4>
                          <form onSubmit={handleAddTx} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <select className="border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value as 'ingreso'|'gasto'})} required>
                                <option value="gasto">{isEs ? 'Gasto' : 'Expense'}</option>
                                <option value="ingreso">{isEs ? 'Ingreso' : 'Income'}</option>
                              </select>
                              <FormattedNumberInput 
                                decimals={2}
                                placeholder={isEs ? "Importe (€)" : "Amount (€)"} 
                                className="border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" 
                                value={newTx.amount ?? ''} 
                                onChange={val => setNewTx({...newTx, amount: val === '' ? 0 : val})} 
                                required 
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" placeholder={isEs ? "Categoría (Ej: IBI)" : "Category (e.g. HOA)"} className="border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} required />
                              <input type="date" className="border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} required />
                            </div>
                            <input type="text" placeholder={isEs ? "Descripción" : "Description"} className="w-full border border-slate-200 dark:border-slate-700 rounded p-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} required />
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Documento / Factura (Opcional)' : 'Document / Invoice (Optional)'}</label>
                              <input 
                                type="file" 
                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 border border-slate-200 dark:border-slate-700 rounded p-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
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
                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-sm p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                              {isEs ? 'Guardar Registro' : 'Save Entry'}
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
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isEs ? 'Inversión Inicial' : 'Initial Investment'}</span>
                                  <span className="text-xl font-bold text-slate-900 dark:text-white">{formatNumber(totalInvested)} €</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isEs ? 'Coste Total Adquisición' : 'Total Acquisition Cost'}</span>
                                  <span className="text-xl font-bold text-slate-900 dark:text-white">{formatNumber(totalCost)} €</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isEs ? 'Beneficio Potencial' : 'Potential Profit'}</span>
                                  <span className={`text-xl font-bold ${potentialProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {potentialProfit > 0 ? '+' : ''}{formatNumber(potentialProfit)} €
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isEs ? 'ROI (Sobre Inversión)' : 'ROI (On Investment)'}</span>
                                  <span className={`text-xl font-bold ${roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
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
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isEs ? 'Rentabilidad Bruta' : 'Gross Yield'}</span>
                                <span className="text-xl font-bold text-slate-900 dark:text-white">{formatNumber(grossYield, 2)}%</span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isEs ? 'Rentabilidad Neta' : 'Net Yield'}</span>
                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(netYield, 2)}%</span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isEs ? 'Flujo de Caja' : 'Cash Flow'}</span>
                                <span className={`text-xl font-bold ${cashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {cashFlow > 0 ? '+' : ''}{formatNumber(cashFlow, 0)} €<span className="text-[12px] font-normal text-slate-500 dark:text-slate-400">{isEs ? '/mes' : '/mo'}</span>
                                </span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{isEs ? 'PER' : 'PER'}</span>
                                <span className="text-xl font-bold text-slate-900 dark:text-white">{per > 0 ? per.toFixed(1) : '-'} <span className="text-[12px] font-normal text-slate-500 dark:text-slate-400">{isEs ? 'años' : 'years'}</span></span>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">{isEs ? 'Historial' : 'History'}</h4>
                          {propertyTxs.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                              {isEs ? 'No hay registros financieros.' : 'No financial records.'}
                            </div>
                          ) : (
                            propertyTxs.map(tx => (
                              <div key={tx.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'ingreso' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
                                    {tx.type === 'ingreso' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-white text-[14px] leading-tight flex items-center gap-1.5">
                                      {tx.category}
                                      {tx.document && (
                                        <a href={tx.document} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600" title={isEs ? "Ver documento" : "View document"}>
                                          <Paperclip size={12} />
                                        </a>
                                      )}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 text-[12px]">{formatDate(tx.date)}</div>
                                  </div>
                                </div>
                                <div className={`font-bold ${tx.type === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
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
                       <button onClick={() => setViewMode('info')} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold mb-5 text-[14px]">
                         <ChevronLeft size={18} /> {isEs ? 'Cancelar edición' : 'Cancel edit'}
                       </button>
                       
                       <form id="edit-property-form" onSubmit={handleUpdate} className="flex-1 overflow-y-auto">
                          <PropertyFields data={selectedProperty} onChange={(d) => setSelectedProperty(d as Property)} />
                       </form>
                       <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 shrink-0">
                         <button type="submit" form="edit-property-form" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white py-3 rounded-xl font-semibold text-sm shadow-sm">
                           {isEs ? 'Guardar Cambios' : 'Save Changes'}
                         </button>
                       </div>
                     </div>
                  )}

                  {viewMode === 'contract' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                       <button onClick={() => setViewMode('info')} className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 hover:text-blue-600 font-semibold mb-6 text-[14px]">
                         <ChevronLeft size={18} /> {isEs ? 'Volver al inmueble' : 'Back to property'}
                       </button>
                       <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-5">{isEs ? 'Detalles del Contrato' : 'Contract Details'}</h3>
                       
                       <div className="space-y-4 flex-1">
                         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                            <div className="text-[11px] text-slate-400 font-semibold uppercase mb-3 tracking-wider">{isEs ? 'Inquilinos' : 'Tenants'} ({contractTenants.length})</div>
                            {contractTenants.length > 0 ? (
                              <div className="space-y-3">
                                {contractTenants.map((t, idx) => t && (
                                  <div key={t.id} className={`flex flex-col gap-1 ${idx > 0 ? 'pt-3 border-t border-slate-100 dark:border-slate-700' : ''}`}>
                                    <div className="font-bold text-[14px] text-slate-900 dark:text-white">{t.name}</div>
                                    <div className="text-[12px] text-slate-500 dark:text-slate-400">{t.email}</div>
                                    <div className="text-[12px] text-slate-500 dark:text-slate-400">{t.phone}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 dark:text-slate-400">{isEs ? 'Sin información' : 'No information'}</div>
                            )}
                         </div>
                         
                         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                            <div className="text-[11px] text-slate-400 font-semibold uppercase mb-3">{isEs ? 'Condiciones' : 'Conditions'}</div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                              <span className="text-[13px] text-slate-500 dark:text-slate-400">{isEs ? 'Renta Mensual' : 'Monthly Rent'}</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(contract?.rentAmount)} €</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[13px] text-slate-500 dark:text-slate-400">{isEs ? 'Fianza Depositada' : 'Deposit'}</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(contract?.deposit)} €</span>
                            </div>
                         </div>

                         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                            <div className="text-[11px] text-slate-400 font-semibold uppercase mb-3">{isEs ? 'Vigencia' : 'Term'}</div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                              <span className="text-[13px] text-slate-500 dark:text-slate-400">{isEs ? 'Fecha Inicio' : 'Start Date'}</span>
                              <span className="font-medium text-slate-900 dark:text-white">{contract?.startDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[13px] text-slate-500 dark:text-slate-400">{isEs ? 'Fecha Fin' : 'End Date'}</span>
                              <span className="font-medium text-slate-900 dark:text-white">{contract?.endDate}</span>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">{isEs ? 'Añadir Inmueble' : 'Add Property'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-700 rounded-full p-1 border border-slate-200 dark:border-slate-600 shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50">
              <form id="add-property-form" onSubmit={handleAdd}>
                <PropertyFields data={newProp} onChange={setNewProp} />
              </form>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">{isEs ? 'Cancelar' : 'Cancel'}</button>
              <button type="submit" form="add-property-form" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm">{isEs ? 'Guardar Inmueble' : 'Save Property'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Incidencia */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setShowIssueForm(false)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-2xl shrink-0">
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">{editingIssueId ? (isEs ? 'Editar Incidencia' : 'Edit Issue') : (isEs ? 'Añadir Incidencia' : 'Add Issue')}</h2>
              <button onClick={() => setShowIssueForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-700 rounded-full p-1 border border-slate-200 dark:border-slate-600 shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Título de la alerta' : 'Alert Title'}</label>
                <input 
                  type="text" 
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({...issueForm, title: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none"
                  placeholder={isEs ? "Ej. Limpieza general necesaria" : "E.g. General cleaning needed"}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Inmueble Asignado' : 'Assigned Property'}</label>
                <select
                  value={issueForm.propertyId}
                  onChange={(e) => setIssueForm({...issueForm, propertyId: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none bg-white dark:bg-slate-800"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{isEs ? 'Puedes reasignar la alerta a otro activo como precaución.' : 'You can reassign the alert to another asset.'}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Descripción' : 'Description'}</label>
                <textarea 
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none min-h-[100px] resize-none"
                  placeholder={isEs ? "Detalles sobre la incidencia..." : "Details regarding the issue..."}
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Estado' : 'Status'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setIssueForm({...issueForm, status: 'Abierta'})}
                    className={`py-2 text-xs font-semibold rounded-lg border ${issueForm.status === 'Abierta' ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    {isEs ? 'Abierta' : 'Open'}
                  </button>
                  <button 
                    onClick={() => setIssueForm({...issueForm, status: 'En Progreso'})}
                    className={`py-2 text-xs font-semibold rounded-lg border ${issueForm.status === 'En Progreso' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    {isEs ? 'En Progreso' : 'In Progress'}
                  </button>
                  <button 
                    onClick={() => setIssueForm({...issueForm, status: 'Resuelta'})}
                    className={`py-2 text-xs font-semibold rounded-lg border ${issueForm.status === 'Resuelta' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    {isEs ? 'Resuelta' : 'Resolved'}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between gap-3 shrink-0 rounded-b-2xl">
              {editingIssueId ? (
                <button type="button" onClick={handleDeleteIssue} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors" title={isEs ? "Eliminar Alerta" : "Delete Alert"}>
                  <Trash2 size={20} />
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowIssueForm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">{isEs ? 'Cancelar' : 'Cancel'}</button>
                <button onClick={handleSaveIssue} disabled={!issueForm.title.trim()} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-50">{isEs ? 'Guardar Incidencia' : 'Save Issue'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      {/* Document Viewer Modal */}
      <DocumentViewerModal 
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        documentUrl={viewingDoc?.url || ''}
        documentName={viewingDoc?.name || ''}
      />
    </div>
  );
}
