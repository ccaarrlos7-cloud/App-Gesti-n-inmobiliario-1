import { useState } from 'react';
import { Contract, Tenant } from '../types';
import { X, Eye, Phone, Mail, FileText, CreditCard, Building2, Users, Plus, Upload, Trash2, Download, Paperclip, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../store';
import { formatDate, formatNumber, getContractTruePaymentStatus } from '../utils';
import SettingsModal from './SettingsModal';
import { User } from 'lucide-react';
import FormattedNumberInput from './FormattedNumberInput';

import { DocumentViewerModal } from './DocumentViewerModal';
import { DocumentActionButtons } from './DocumentActionButtons';

export default function CRMView() {
  const { properties, updateProperty, tenants, addTenant, contracts, addContract, updateContract, language, userName, avatarUrl } = useAppContext();
  const isEs = language === 'Español';
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  const [showNewTenantForm, setShowNewTenantForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [newTenants, setNewTenants] = useState<Partial<Tenant>[]>([{ name: '', email: '', phone: '', dni: '' }]);
  const [newContract, setNewContract] = useState<Partial<Contract>>({ propertyId: '', startDate: '', endDate: '', rentAmount: 0, deposit: 0, status: 'Activo' });

  const getPropertyInfo = (id: string) => properties.find(p => p.id === id);

  const monthsList = isEs 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getPaymentStatusLabel = (status: string) => {
    if (status === 'Al día') return isEs ? 'Al día' : 'Paid';
    if (status === 'Pendiente') return isEs ? 'Pendiente' : 'Pending';
    if (status === 'Deuda') return isEs ? 'Deuda' : 'Overdue';
    if (status === 'Finalizado') return isEs ? 'Finalizado' : 'Ended';
    return status;
  };

  const exportContractPDF = () => {
    if (!selectedContract) return;
    const doc = new jsPDF();
    const property = getPropertyInfo(selectedContract.propertyId);
    const contractTenants = getTenantsInfo(selectedContract.tenantIds);
    
    // Header
    doc.setFontSize(20);
    doc.text(isEs ? 'Detalles del Contrato de Alquiler' : 'Rental Contract Details', 14, 22);
    
    // Inmueble Info
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`${isEs ? 'Inmueble' : 'Property'}: ${property?.title || (isEs ? 'Desconocido' : 'Unknown')}`, 14, 34);
    doc.text(`${isEs ? 'Dirección' : 'Address'}: ${property?.address || (isEs ? 'Desconocido' : 'Unknown')}`, 14, 42);
    
    // Contrato Info
    doc.text(`${isEs ? 'Vigencia' : 'Term'}: ${formatDate(selectedContract.startDate)} ${isEs ? 'a' : 'to'} ${formatDate(selectedContract.endDate)}`, 14, 52);
    doc.text(`${isEs ? 'Renta Mensual' : 'Monthly Rent'}: ${formatNumber(selectedContract.rentAmount)} €`, 14, 60);
    doc.text(`${isEs ? 'Fianza' : 'Deposit'}: ${formatNumber(selectedContract.deposit)} €`, 14, 68);
    doc.text(`${isEs ? 'Estado General' : 'General Status'}: ${getPaymentStatusLabel(getContractTruePaymentStatus(selectedContract.monthlyPayments))}`, 14, 76);
    
    // Inquilinos
    autoTable(doc, {
      startY: 86,
      head: [[isEs ? 'Inquilino' : 'Tenant', 'Email', isEs ? 'Teléfono' : 'Phone', isEs ? 'DNI' : 'ID']],
      body: contractTenants.map(t => [
        t?.name || '',
        t?.email || '',
        t?.phone || '',
        t?.dni || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] }
    });
    
    // Pagos del año actual
    const paymentData = monthsList.map((month, idx) => {
      const monthKey = `${paymentYear}-${String(idx + 1).padStart(2, '0')}`;
      const status = selectedContract.monthlyPayments?.[monthKey] || 'Pendiente';
      return [month, getPaymentStatusLabel(status)];
    });
    
    doc.text(`${isEs ? 'Control de Pagos' : 'Payment Control'} (${paymentYear})`, 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[isEs ? 'Mes' : 'Month', isEs ? 'Estado de Pago' : 'Payment Status']],
      body: paymentData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`contrato_${property?.title.replace(/\s+/g, '_')}_${selectedContract.id}.pdf`);
  };

  const getTenantsInfo = (ids: string[]) => ids.map(id => tenants.find(t => t.id === id)).filter(t => t !== undefined);

  const currentYearStr = new Date().getFullYear();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYearStr}-${currentMonthStr}`;

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="min-h-[64px] py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900 dark:text-white hidden sm:block">{isEs ? 'Inquilinos' : 'Tenants'}</h1>
        
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewTenantForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center shadow-sm shrink-0"
          >
            <Plus size={20} className="sm:hidden" />
            <span className="hidden sm:inline">{isEs ? '+ Añadir Inquilino' : '+ Add Tenant'}</span>
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

      <div className="p-4 sm:p-6 flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col gap-3">
          {contracts.map(contract => {
            const property = getPropertyInfo(contract.propertyId);
            const contractTenants = getTenantsInfo(contract.tenantIds);
            const titleTenant = contractTenants[0]; // primary tenant
            const othersCount = contractTenants.length - 1;
            const trueStatus = getContractTruePaymentStatus(contract.monthlyPayments);

            return (
              <div 
                key={contract.id} 
                onClick={() => setSelectedContract(contract)}
                className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer flex items-center gap-4 ${contract.status === 'Finalizado' ? 'opacity-50 bg-slate-50 dark:bg-slate-900' : ''}`}
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-lg relative">
                  {titleTenant?.name.charAt(0) || '?'}
                  {othersCount > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-[10px] font-bold border border-white dark:border-slate-800">
                      +{othersCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-[15px] truncate">
                    {titleTenant?.name || (isEs ? 'Inquilino desconocido' : 'Unknown tenant')} {othersCount > 0 && <span className="text-slate-500 dark:text-slate-400 font-normal">{isEs ? `y ${othersCount} más` : `and ${othersCount} more`}</span>}
                  </p>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                    <Building2 size={12} /> {property?.title || (isEs ? 'Inmueble desconocido' : 'Unknown property')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {contract.status === 'Finalizado' ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {isEs ? 'Finalizado' : 'Ended'}
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase
                      ${trueStatus === 'Al día' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 
                        trueStatus === 'Pendiente' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' : 
                        'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'}
                    `}>
                      {getPaymentStatusLabel(trueStatus)}
                    </span>
                  )}
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                    {formatNumber(contract.rentAmount)} €
                  </span>
                </div>
              </div>
            );
          })}
          {contracts.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {isEs ? 'No hay contratos registrados.' : 'No contracts registered.'}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${selectedContract ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSelectedContract(null)}>
        <div 
          className={`absolute inset-y-0 right-0 w-full sm:w-[380px] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 transform border-l border-slate-200 dark:border-slate-800 flex flex-col ${selectedContract ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          {selectedContract && (() => {
            const contractTenants = getTenantsInfo(selectedContract.tenantIds);
            const property = getPropertyInfo(selectedContract.propertyId);
            return (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/80">
                <h2 className="text-[18px] font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users size={20} className="text-blue-600 dark:text-blue-400"/> {isEs ? 'Detalle del Contrato' : 'Contract Details'}</h2>
                <button onClick={exportContractPDF} className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg mr-2 transition-colors">
                  <FileDown size={14} /> {isEs ? 'Exportar' : 'Export'}
                </button>
                <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-700 rounded-full p-1 border border-slate-200 dark:border-slate-600 shadow-sm">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50">
                <div className="mb-6 space-y-4">
                  <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">{isEs ? 'Inquilinos' : 'Tenants'} ({contractTenants.length})</h3>
                  {contractTenants.map(t => t && (
                    <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-500 dark:text-slate-300">
                        {t.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[15px] text-slate-900 dark:text-white truncate">{t.name}</div>
                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[12px] truncate">
                            <Mail size={14} className="text-slate-400" /> {t.email}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[12px] truncate">
                            <Phone size={14} className="text-slate-400" /> {t.phone}
                          </div>
                          {t.dni && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[12px] truncate">
                              <CreditCard size={14} className="text-slate-400" /> {t.dni}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                    <div className="text-[11px] text-slate-400 uppercase font-bold mb-3 flex items-center gap-1.5 tracking-wider">
                      <FileText size={14} /> {isEs ? 'Información del Contrato' : 'Contract Information'}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[12px] text-slate-500 dark:text-slate-400">{isEs ? 'Inmueble Vinculado' : 'Linked Property'}</span>
                        <div className="text-[14px] font-medium text-slate-900 dark:text-white leading-tight mt-0.5">{property?.title}</div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-[13px] text-slate-500 dark:text-slate-400">{isEs ? 'Renta Mensual' : 'Monthly Rent'}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatNumber(selectedContract.rentAmount)} €</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-slate-500 dark:text-slate-400">{isEs ? 'Fianza Depositada' : 'Deposit'}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(selectedContract.deposit)} €</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-[13px] text-slate-500 dark:text-slate-400">{isEs ? 'Vigencia' : 'Term'}</span>
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white">
                          {formatDate(selectedContract.startDate)} {isEs ? 'a' : 'to'} {formatDate(selectedContract.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-[13px] text-slate-500 dark:text-slate-400">{isEs ? 'Estado General' : 'General Status'}</span>
                        <div className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase
                          ${getContractTruePaymentStatus(selectedContract.monthlyPayments) === 'Al día' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 
                            getContractTruePaymentStatus(selectedContract.monthlyPayments) === 'Pendiente' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'}`}>
                          {getPaymentStatusLabel(getContractTruePaymentStatus(selectedContract.monthlyPayments))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5 tracking-wider">
                        {isEs ? 'Control de Pagos Anual' : 'Annual Payment Control'}
                      </div>
                      <select 
                        value={paymentYear} 
                        onChange={e => setPaymentYear(Number(e.target.value))}
                        className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {monthsList.map((monthName, idx) => {
                        const monthKey = `${paymentYear}-${String(idx + 1).padStart(2, '0')}`;
                        const startMonth = selectedContract.startDate ? selectedContract.startDate.slice(0, 7) : '';
                        const endMonth = selectedContract.endDate ? selectedContract.endDate.slice(0, 7) : '';
                        const isOutOfContract = (startMonth && monthKey < startMonth) || (endMonth && monthKey > endMonth);
                        
                        const currentStatus = isOutOfContract 
                          ? 'Fuera' 
                          : (selectedContract.monthlyPayments?.[monthKey] || 'Pendiente');
                        
                        return (
                          <div key={monthKey} className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-center">{monthName}</span>
                            {isOutOfContract ? (
                              <div className="w-full text-center px-1 py-1.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-400">
                                -
                              </div>
                            ) : (
                              <select
                                className={`w-full text-center px-1 py-1.5 rounded text-[10px] font-bold uppercase border-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none
                                  ${currentStatus === 'Al día' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 
                                    currentStatus === 'Pendiente' ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'}`}
                                value={currentStatus}
                                onChange={(e) => {
                                  const newStatus = e.target.value as 'Al día' | 'Pendiente' | 'Deuda';
                                  const newMonthlyPayments = { ...(selectedContract.monthlyPayments || {}), [monthKey]: newStatus };
                                  
                                  const newGeneralStatus = getContractTruePaymentStatus(newMonthlyPayments);
                                  
                                  const updated = { ...selectedContract, monthlyPayments: newMonthlyPayments, paymentStatus: newGeneralStatus };
                                  setSelectedContract(updated);
                                  updateContract(updated);
                                }}
                              >
                                <option value="Al día">{isEs ? 'Al día' : 'Paid'}</option>
                                <option value="Pendiente">{isEs ? 'Pendiente' : 'Pending'}</option>
                                <option value="Deuda">{isEs ? 'Deuda' : 'Overdue'}</option>
                              </select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5 tracking-wider">
                        <Paperclip size={14} /> {isEs ? 'Gestión Documental' : 'Document Management'}
                      </div>
                      <label className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer">
                        <Upload size={14} /> {isEs ? 'Subir Documento' : 'Upload Document'}
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
                                  id: `doc-${Date.now()}`,
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
                        <div className="text-center py-6 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                          <p className="text-sm text-slate-400">{isEs ? 'No hay documentos adjuntos' : 'No documents attached'}</p>
                        </div>
                      ) : (
                        selectedContract.documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <FileText size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{doc.name}</p>
                                <p className="text-[11px] text-slate-400">
                                  {new Date(doc.date).toLocaleDateString()} {doc.size ? `• ${(doc.size / 1024 / 1024).toFixed(2)} MB` : ''}
                                </p>
                              </div>
                            </div>
                            <DocumentActionButtons 
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
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 flex flex-col gap-3">
                {property?.rentalContractUrl ? (
                  <a href={property.rentalContractUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-3.5 rounded-xl text-[14px] font-semibold transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Eye size={18} /> {isEs ? 'Ver Contrato PDF' : 'View Contract PDF'}
                  </a>
                ) : (
                  <button disabled className="w-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 p-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                    <FileText size={18} /> {isEs ? 'Sin contrato adjunto' : 'No contract attached'}
                  </button>
                )}
                
                {selectedContract.status !== 'Finalizado' && (
                  <button 
                    onClick={() => {
                      if (window.confirm(isEs ? '¿Estás seguro de que deseas dar por finalizado este contrato? El inmueble pasará a estar Vacío y dejará de generar ingresos automáticos de alquiler.' : 'Are you sure you want to terminate this contract? The property will become Vacant and stop generating automatic rental income.')) {
                        const updated = { ...selectedContract, status: 'Finalizado' as const };
                        setSelectedContract(updated);
                        updateContract(updated);
                        
                        // Update property status to 'Vacío'
                        const relatedProperty = properties.find(p => p.id === selectedContract.propertyId);
                        if (relatedProperty) {
                          updateProperty({ ...relatedProperty, status: 'Vacío' });
                        }
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 p-3.5 rounded-xl text-[14px] font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> {isEs ? 'Terminar Contrato' : 'Terminate Contract'}
                  </button>
                )}
              </div>
            </div>
            );
          })()}
        </div>
      </div>
      {showNewTenantForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setShowNewTenantForm(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-2xl shrink-0">
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">{isEs ? 'Añadir Inquilino' : 'Add Tenant'}</h2>
              <button onClick={() => setShowNewTenantForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-700 rounded-full p-1 border border-slate-200 dark:border-slate-600 shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <form id="new-tenant-form" onSubmit={async (e) => {
                e.preventDefault();
                
                // 1. Create Tenants sequentially and safely
                const createdTenantIds: string[] = [];
                for (let index = 0; index < newTenants.length; index++) {
                  const nt = newTenants[index];
                  if (nt.name || nt.email) {
                    const newTenant = await addTenant({
                      name: nt.name || '',
                      email: nt.email || '',
                      phone: nt.phone || '',
                      dni: nt.dni || ''
                    });
                    
                    if (!newTenant) {
                      console.error("Error al crear inquilino. Se aborta la creación del contrato.");
                      return; // Abort the whole process, keep the form open so they can retry or see the error
                    }
                    createdTenantIds.push(newTenant.id);
                  }
                }

                // 2. Create Contract
                const contractToSave: Omit<Contract, 'id'> = {
                  tenantIds: createdTenantIds,
                  propertyId: newContract.propertyId || '',
                  startDate: newContract.startDate || '',
                  endDate: newContract.endDate || '',
                  rentAmount: Math.max(0, Number(newContract.rentAmount) || 0),
                  deposit: Math.max(0, Number(newContract.deposit) || 0),
                  status: 'Activo',
                  paymentStatus: 'Pendiente',
                  monthlyPayments: {}
                };
                
                const createdContract = await addContract(contractToSave);
                if (!createdContract) {
                  console.error("Error al crear el contrato. Se conservan los inquilinos creados pero el contrato fue abortado.");
                  return; // Keep form open
                }

                // 3. Update Property
                const relatedProperty = properties.find(p => p.id === newContract.propertyId);
                if (relatedProperty) {
                  updateProperty({ ...relatedProperty, status: 'Ocupado' });
                }

                // Close and reset
                setShowNewTenantForm(false);
                setNewTenants([{ name: '', email: '', phone: '', dni: '' }]);
                setNewContract({ propertyId: '', startDate: '', endDate: '', rentAmount: 0, deposit: 0, status: 'Activo' });
              }}>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{isEs ? 'Datos de Inquilinos' : 'Tenant Information'}</h3>
                    <button 
                      type="button" 
                      onClick={() => setNewTenants([...newTenants, { name: '', email: '', phone: '', dni: '' }])}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Plus size={14} /> {isEs ? 'Añadir otro' : 'Add another'}
                    </button>
                  </div>
                  {newTenants.map((nt, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl relative">
                      {newTenants.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setNewTenants(newTenants.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Nombre Completo' : 'Full Name'} {index > 0 ? `${index + 1} ` : ''}*</label>
                        <input type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none" value={nt.name || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email *</label>
                        <input type="email" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none" value={nt.email || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], email: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Teléfono *' : 'Phone *'}</label>
                        <input type="tel" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none" value={nt.phone || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], phone: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'DNI / Pasaporte' : 'ID / Passport'}</label>
                        <input type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none" value={nt.dni || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], dni: e.target.value };
                          setNewTenants(updated);
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{isEs ? 'Detalles del Contrato' : 'Contract Details'}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Inmueble *' : 'Property *'}</label>
                      <select 
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 outline-none" 
                        value={newContract.propertyId || ''} 
                        onChange={e => {
                          const propId = e.target.value;
                          const selectedProp = properties.find(p => p.id === propId);
                          setNewContract({
                            ...newContract, 
                            propertyId: propId,
                            rentAmount: Math.max(0, Number(selectedProp?.price) || 0)
                          });
                        }}
                        required
                      >
                        <option value="" disabled>{isEs ? 'Selecciona un inmueble' : 'Select a property'}</option>
                        {properties.filter(p => p.status === 'Vacío' || p.status === 'En Venta').map(p => (
                          <option key={p.id} value={p.id}>{p.title} - {p.address}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Renta Mensual (€) *' : 'Monthly Rent (€) *'}</label>
                      <FormattedNumberInput 
                        decimals={2}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none" 
                        value={newContract.rentAmount ?? ''} 
                        onChange={val => setNewContract({...newContract, rentAmount: val === '' ? 0 : val})} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Fianza Depositada (€) *' : 'Deposit (€) *'}</label>
                      <FormattedNumberInput 
                        decimals={2}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none" 
                        value={newContract.deposit ?? ''} 
                        onChange={val => setNewContract({...newContract, deposit: val === '' ? 0 : val})} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Fecha de Inicio *' : 'Start Date *'}</label>
                      <input type="date" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none" value={newContract.startDate || ''} onChange={e => setNewContract({...newContract, startDate: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{isEs ? 'Fecha de Fin *' : 'End Date *'}</label>
                      <input type="date" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-500 outline-none" value={newContract.endDate || ''} onChange={e => setNewContract({...newContract, endDate: e.target.value})} required />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button type="button" onClick={() => setShowNewTenantForm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">{isEs ? 'Cancelar' : 'Cancel'}</button>
              <button type="submit" form="new-tenant-form" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center gap-2">
                {isEs ? 'Guardar y Activar Contrato' : 'Save and Activate Contract'}
              </button>
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
