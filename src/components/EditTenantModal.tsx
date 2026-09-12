import React, { useState, useEffect } from 'react';
import { Tenant } from '../types';
import { X, Save, AlertCircle } from 'lucide-react';

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSave: (tenant: Tenant) => Promise<void>;
  isEs: boolean;
}

export function EditTenantModal({ isOpen, onClose, tenant, onSave, isEs }: EditTenantModalProps) {
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (tenant) {
      setFormData({ ...tenant });
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const hasProfile = !!tenant.profileId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    setIsSaving(true);
    try {
      await onSave({ ...tenant, ...formData } as Tenant);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[160] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-2xl">
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">
            {isEs ? 'Editar Inquilino' : 'Edit Tenant'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-700 rounded-full p-1 border border-slate-200 dark:border-slate-600 shadow-sm">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {hasProfile && (
            <div className="bg-slate-100 dark:bg-slate-800 dark:bg-slate-800/40 text-slate-700 dark:text-slate-400 p-3 rounded-lg text-[13px] flex items-start gap-2 border border-slate-200 dark:border-slate-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                {isEs 
                  ? 'Este inquilino ya tiene una cuenta vinculada. El email de acceso no se puede modificar desde aquí.' 
                  : 'This tenant already has a linked account. The login email cannot be changed from here.'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEs ? 'Nombre Completo *' : 'Full Name *'}
            </label>
            <input 
              type="text" 
              required
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500" 
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEs ? 'Email *' : 'Email *'}
            </label>
            <input 
              type="email" 
              required
              disabled={hasProfile}
              value={formData.email || ''} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEs ? 'Teléfono' : 'Phone'}
              </label>
              <input 
                type="tel" 
                value={formData.phone || ''} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500" 
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEs ? 'DNI / NIE' : 'ID'}
              </label>
              <input 
                type="text" 
                value={formData.dni || ''} 
                onChange={e => setFormData({...formData, dni: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[14px] text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500" 
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isEs ? 'Cancelar' : 'Cancel'}
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#FACC15] hover:bg-[#eab308] text-slate-900 px-5 py-2 rounded-lg text-[14px] font-bold transition-colors disabled:opacity-70"
            >
              <Save size={16} />
              {isSaving ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Guardar Cambios' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
