import React, { useState, useEffect } from 'react';
import { Contract, Tenant } from '../types';
import { X, Save } from 'lucide-react';

interface EditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  tenants: Tenant[];
  onSave: (contract: Contract) => Promise<void>;
  isEs: boolean;
}

export function EditContractModal({ isOpen, onClose, contract, tenants, onSave, isEs }: EditContractModalProps) {
  const [formData, setFormData] = useState<Partial<Contract>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (contract) {
      setFormData({
        id: contract.id,
        propertyId: contract.propertyId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentAmount: contract.rentAmount,
        deposit: contract.deposit,
        status: contract.status,
        paymentStatus: contract.paymentStatus,
        monthlyPayments: contract.monthlyPayments,
        contractDocuments: contract.contractDocuments
      });
      setSelectedTenantIds(contract.tenantIds || []);
    }
  }, [contract]);

  if (!isOpen || !contract) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.rentAmount) return;
    
    setIsSaving(true);
    try {
      const updatedContract: Contract = {
        ...(formData as Contract),
        tenantIds: selectedTenantIds
      };
      await onSave(updatedContract);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenantIds(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[160] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-2xl shrink-0">
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">
            {isEs ? 'Editar Contrato' : 'Edit Contract'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-700 rounded-full p-1 border border-slate-200 dark:border-slate-600 shadow-sm">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          <form id="edit-contract-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Inquilinos Asignados */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
                {isEs ? 'Inquilinos Vinculados' : 'Linked Tenants'}
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {tenants.map(t => (
                  <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                    <input 
                      type="checkbox" 
                      checked={selectedTenantIds.includes(t.id)}
                      onChange={() => toggleTenantSelection(t.id)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-slate-900 dark:text-white leading-tight">{t.name}</span>
                      <span className="text-[12px] text-slate-500 dark:text-slate-400">{t.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Datos del Contrato */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
                {isEs ? 'Detalles del Contrato' : 'Contract Details'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEs ? 'Fecha de Inicio *' : 'Start Date *'}
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate || ''} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEs ? 'Fecha de Fin *' : 'End Date *'}
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.endDate || ''} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEs ? 'Renta Mensual (€) *' : 'Monthly Rent (€) *'}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={formData.rentAmount || ''} 
                    onChange={e => setFormData({...formData, rentAmount: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEs ? 'Fianza (€)' : 'Deposit (€)'}
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.deposit || ''} 
                    onChange={e => setFormData({...formData, deposit: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEs ? 'Estado' : 'Status'}
                </label>
                <select 
                  value={formData.status || 'Activo'} 
                  onChange={e => setFormData({...formData, status: e.target.value as 'Activo' | 'Finalizado' | 'Pendiente de firma'})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                >
                  <option value="Activo">{isEs ? 'Activo' : 'Active'}</option>
                  <option value="Pendiente de firma">{isEs ? 'Pendiente de firma' : 'Pending Signature'}</option>
                  <option value="Finalizado">{isEs ? 'Finalizado' : 'Ended'}</option>
                </select>
              </div>
            </div>
            
          </form>
        </div>
        
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl shrink-0 flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isEs ? 'Cancelar' : 'Cancel'}
          </button>
          <button 
            type="submit"
            form="edit-contract-form"
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-[14px] font-bold transition-colors disabled:opacity-70"
          >
            <Save size={16} />
            {isSaving ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Guardar Cambios' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
