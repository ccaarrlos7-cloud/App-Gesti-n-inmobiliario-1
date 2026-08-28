import { useState } from 'react';
import { Contract, Tenant } from '../types';
import { X, Eye, Phone, Mail, FileText, CreditCard, Building2, Users, Plus, Upload, Trash2, Download, Paperclip, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../store';
import { formatDate, formatNumber } from '../utils';
import SettingsModal from './SettingsModal';
import { User } from 'lucide-react';

export default function CRMView() {
  const { properties, updateProperty, tenants, addTenant, contracts, addContract, updateContract } = useAppContext();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  const [showNewTenantForm, setShowNewTenantForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { userName, avatarUrl } = useAppContext();
  
  const [newTenants, setNewTenants] = useState<Partial<Tenant>[]>([{ name: '', email: '', phone: '', dni: '' }]);
  const [newContract, setNewContract] = useState<Partial<Contract>>({ propertyId: '', startDate: '', endDate: '', rentAmount: 0, deposit: 0, status: 'Activo' });

  const getPropertyInfo = (id: string) => properties.find(p => p.id === id);

  const exportContractPDF = () => {
    if (!selectedContract) return;
    const doc = new jsPDF();
    const property = getPropertyInfo(selectedContract.propertyId);
    const contractTenants = getTenantsInfo(selectedContract.tenantIds);
    
    // Header
    doc.setFontSize(20);
    doc.text('Detalles del Contrato de Alquiler', 14, 22);
    
    // Inmueble Info
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Inmueble: ${property?.title || 'Desconocido'}`, 14, 34);
    doc.text(`Dirección: ${property?.address || 'Desconocido'}`, 14, 42);
    
    // Contrato Info
    doc.text(`Vigencia: ${formatDate(selectedContract.startDate)} a ${formatDate(selectedContract.endDate)}`, 14, 52);
    doc.text(`Renta Mensual: ${formatNumber(selectedContract.rentAmount)} €`, 14, 60);
    doc.text(`Fianza: ${formatNumber(selectedContract.deposit)} €`, 14, 68);
    doc.text(`Estado General: ${selectedContract.paymentStatus}`, 14, 76);
    
    // Inquilinos
    autoTable(doc, {
      startY: 86,
      head: [['Inquilino', 'Email', 'Teléfono', 'DNI']],
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
    const paymentYearStr = paymentYear.toString();
    const paymentData = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month, idx) => {
      const monthKey = `${paymentYear}-${String(idx + 1).padStart(2, '0')}`;
      const status = selectedContract.monthlyPayments?.[monthKey] || 'Pendiente';
      return [month, status];
    });
    
    doc.text(`Control de Pagos (${paymentYear})`, 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Mes', 'Estado de Pago']],
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
    <div className="flex flex-col h-full relative">
      <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900 hidden sm:block">Inquilinos</h1>
        
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
          {/* Espaciador invisible para alinear como en Portfolio si no hay barra de busqueda */}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewTenantForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center shadow-sm shrink-0"
          >
            <Plus size={20} className="sm:hidden" />
            <span className="hidden sm:inline">+ Añadir Inquilino</span>
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

      <div className="p-4 sm:p-6 flex-1 overflow-auto bg-slate-50/50">
        <div className="flex flex-col gap-3">
          {contracts.map(contract => {
            const property = getPropertyInfo(contract.propertyId);
            const contractTenants = getTenantsInfo(contract.tenantIds);
            const titleTenant = contractTenants[0]; // primary tenant
            const othersCount = contractTenants.length - 1;

            return (
              <div 
                key={contract.id} 
                onClick={() => setSelectedContract(contract)}
                className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-colors cursor-pointer flex items-center gap-4 ${contract.status === 'Finalizado' ? 'opacity-50 bg-slate-50' : ''}`}
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg relative">
                  {titleTenant?.name.charAt(0) || '?'}
                  {othersCount > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold border border-white">
                      +{othersCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-[15px] truncate">
                    {titleTenant?.name || 'Inquilino desconocido'} {othersCount > 0 && <span className="text-slate-500 font-normal">y {othersCount} más</span>}
                  </p>
                  <p className="text-[13px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                    <Building2 size={12} /> {property?.title || 'Inmueble desconocido'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {contract.status === 'Finalizado' ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-600">
                      Finalizado
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase
                      ${(contract.monthlyPayments?.[currentMonthKey] || contract.paymentStatus) === 'Al día' ? 'bg-emerald-50 text-emerald-700' : 
                        (contract.monthlyPayments?.[currentMonthKey] || contract.paymentStatus) === 'Pendiente' ? 'bg-amber-50 text-amber-700' : 
                        'bg-red-50 text-red-700'}
                    `}>
                      {contract.monthlyPayments?.[currentMonthKey] || contract.paymentStatus}
                    </span>
                  )}
                  <span className="text-[13px] font-semibold text-slate-700">
                    {formatNumber(contract.rentAmount)} €
                  </span>
                </div>
              </div>
            );
          })}
          {contracts.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              No hay contratos registrados.
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <div className={`absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${selectedContract ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSelectedContract(null)}>
        <div 
          className={`absolute inset-y-0 right-0 w-full sm:w-[380px] bg-white shadow-2xl transition-transform duration-300 transform border-l border-slate-200 flex flex-col ${selectedContract ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          {selectedContract && (() => {
            const contractTenants = getTenantsInfo(selectedContract.tenantIds);
            const property = getPropertyInfo(selectedContract.propertyId);
            return (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2"><Users size={20} className="text-blue-600"/> Detalle del Contrato</h2>
                <button onClick={exportContractPDF} className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mr-2 transition-colors">
                  <FileDown size={14} /> Exportar
                </button>
                <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 flex-1 overflow-auto bg-slate-50/50">
                <div className="mb-6 space-y-4">
                  <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Inquilinos ({contractTenants.length})</h3>
                  {contractTenants.map(t => t && (
                    <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500">
                        {t.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[15px] text-slate-900 truncate">{t.name}</div>
                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex items-center gap-2 text-slate-500 text-[12px] truncate">
                            <Mail size={14} className="text-slate-400" /> {t.email}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-[12px] truncate">
                            <Phone size={14} className="text-slate-400" /> {t.phone}
                          </div>
                          {t.dni && (
                            <div className="flex items-center gap-2 text-slate-500 text-[12px] truncate">
                              <CreditCard size={14} className="text-slate-400" /> {t.dni}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <div className="text-[11px] text-slate-400 uppercase font-bold mb-3 flex items-center gap-1.5 tracking-wider">
                      <FileText size={14} /> Información del Contrato
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[12px] text-slate-500">Inmueble Vinculado</span>
                        <div className="text-[14px] font-medium text-slate-900 leading-tight mt-0.5">{property?.title}</div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[13px] text-slate-500">Renta Mensual</span>
                        <span className="font-bold text-slate-900">{formatNumber(selectedContract.rentAmount)} €</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-slate-500">Fianza Depositada</span>
                        <span className="font-semibold text-slate-900">{formatNumber(selectedContract.deposit)} €</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[13px] text-slate-500">Vigencia</span>
                        <span className="text-[13px] font-medium text-slate-900">
                          {formatDate(selectedContract.startDate)} a {formatDate(selectedContract.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[13px] text-slate-500">Estado General</span>
                        <div className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase
                          ${selectedContract.paymentStatus === 'Al día' ? 'bg-emerald-100 text-emerald-800' : 
                            selectedContract.paymentStatus === 'Pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {selectedContract.paymentStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5 tracking-wider">
                        Control de Pagos Anual
                      </div>
                      <select 
                        value={paymentYear} 
                        onChange={e => setPaymentYear(Number(e.target.value))}
                        className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((monthName, idx) => {
                        const monthKey = `${paymentYear}-${String(idx + 1).padStart(2, '0')}`;
                        const currentStatus = selectedContract.monthlyPayments?.[monthKey] || 'Pendiente';
                        
                        return (
                          <div key={monthKey} className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase text-center">{monthName}</span>
                            <select
                              className={`w-full text-center px-1 py-1.5 rounded text-[10px] font-bold uppercase border-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none
                                ${currentStatus === 'Al día' ? 'bg-emerald-100 text-emerald-800' : 
                                  currentStatus === 'Pendiente' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-800'}`}
                              value={currentStatus}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'Al día' | 'Pendiente' | 'Deuda';
                                const newMonthlyPayments = { ...(selectedContract.monthlyPayments || {}), [monthKey]: newStatus };
                                
                                const values = Object.values(newMonthlyPayments);
                                let newGeneralStatus: 'Al día' | 'Pendiente' | 'Deuda' = 'Al día';
                                if (values.includes('Deuda')) {
                                  newGeneralStatus = 'Deuda';
                                } else if (values.includes('Pendiente')) {
                                  newGeneralStatus = 'Pendiente';
                                }
                                
                                const updated = { ...selectedContract, monthlyPayments: newMonthlyPayments, paymentStatus: newGeneralStatus };
                                setSelectedContract(updated);
                                updateContract(updated);
                              }}
                            >
                              <option value="Al día">Al día</option>
                              <option value="Pendiente">Pendiente</option>
                              <option value="Deuda">Deuda</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
                                  {new Date(doc.date).toLocaleDateString()} {doc.size ? `• ${(doc.size / 1024 / 1024).toFixed(2)} MB` : ''}
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
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-slate-200 shrink-0 bg-white flex flex-col gap-3">
                {property?.rentalContractUrl ? (
                  <a href={property.rentalContractUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-900 text-white p-3.5 rounded-xl text-[14px] font-semibold hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Eye size={18} /> Ver Contrato PDF
                  </a>
                ) : (
                  <button disabled className="w-full bg-slate-100 text-slate-400 p-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                    <FileText size={18} /> Sin contrato adjunto
                  </button>
                )}
                
                {selectedContract.status !== 'Finalizado' && (
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que deseas dar por finalizado este contrato? El inmueble pasará a estar Vacío y dejará de generar ingresos automáticos de alquiler.')) {
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
                    className="w-full bg-white text-red-600 border border-red-200 p-3.5 rounded-xl text-[14px] font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Terminar Contrato
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
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
              <h2 className="text-[18px] font-bold text-slate-900">Añadir Inquilino</h2>
              <button onClick={() => setShowNewTenantForm(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
              <form id="new-tenant-form" onSubmit={(e) => {
                e.preventDefault();
                
                // 1. Create Tenants
                const createdTenantIds: string[] = [];
                newTenants.forEach((nt, index) => {
                  if (nt.name || nt.email) {
                    const tenantId = `t${Date.now()}-${index}`;
                    createdTenantIds.push(tenantId);
                    addTenant({
                      id: tenantId,
                      name: nt.name || '',
                      email: nt.email || '',
                      phone: nt.phone || '',
                      dni: nt.dni || ''
                    });
                  }
                });

                // 2. Create Contract
                const contractId = `c${Date.now()}`;
                const contractToSave: Contract = {
                  id: contractId,
                  tenantIds: createdTenantIds.length > 0 ? createdTenantIds : [`t${Date.now()}`],
                  propertyId: newContract.propertyId || '',
                  startDate: newContract.startDate || '',
                  endDate: newContract.endDate || '',
                  rentAmount: newContract.rentAmount || 0,
                  deposit: newContract.deposit || 0,
                  status: 'Activo',
                  paymentStatus: 'Al día',
                  monthlyPayments: {}
                };
                addContract(contractToSave);

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
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Datos de Inquilinos</h3>
                    <button 
                      type="button" 
                      onClick={() => setNewTenants([...newTenants, { name: '', email: '', phone: '', dni: '' }])}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Plus size={14} /> Añadir otro
                    </button>
                  </div>
                  {newTenants.map((nt, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl relative">
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
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nombre Completo {index > 0 ? `${index + 1} ` : ''}*</label>
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nt.name || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Email *</label>
                        <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nt.email || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], email: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Teléfono *</label>
                        <input type="tel" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nt.phone || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], phone: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">DNI / Pasaporte</label>
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nt.dni || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], dni: e.target.value };
                          setNewTenants(updated);
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-slate-200 pt-6">
                  <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Detalles del Contrato</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Inmueble *</label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" 
                        value={newContract.propertyId || ''} 
                        onChange={e => {
                          const propId = e.target.value;
                          const selectedProp = properties.find(p => p.id === propId);
                          setNewContract({
                            ...newContract, 
                            propertyId: propId,
                            rentAmount: selectedProp?.price || 0
                          });
                        }}
                        required
                      >
                        <option value="" disabled>Selecciona un inmueble</option>
                        {properties.filter(p => p.status === 'Vacío' || p.status === 'En Venta').map(p => (
                          <option key={p.id} value={p.id}>{p.title} - {p.address}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Renta Mensual (€) *</label>
                      <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newContract.rentAmount || ''} onChange={e => setNewContract({...newContract, rentAmount: Number(e.target.value)})} required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Fianza Depositada (€) *</label>
                      <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newContract.deposit || ''} onChange={e => setNewContract({...newContract, deposit: Number(e.target.value)})} required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Fecha de Inicio *</label>
                      <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newContract.startDate || ''} onChange={e => setNewContract({...newContract, startDate: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Fecha de Fin *</label>
                      <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newContract.endDate || ''} onChange={e => setNewContract({...newContract, endDate: e.target.value})} required />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button type="button" onClick={() => setShowNewTenantForm(false)} className="px-4 py-2 text-slate-600 font-semibold text-sm hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" form="new-tenant-form" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center gap-2">
                Guardar y Activar Contrato
              </button>
            </div>
          </div>
        </div>
      )}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
