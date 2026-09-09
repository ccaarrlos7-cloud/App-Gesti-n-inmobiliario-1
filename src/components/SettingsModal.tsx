import { formatNumber } from "../utils";
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Moon, Globe, Bell, Download, Book, Mail, Shield, ChevronRight, ChevronLeft, User, X, Check, FileText, Table, Send, Sun, LogOut } from 'lucide-react';
import { useAppContext } from '../store';
import { supabase } from '../lib/supabase';
import { exportYearlyDataPDF } from '../utils';

export interface SettingsModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName?: (name: string) => void;
  avatarUrl?: string;
  setAvatarUrl?: (url: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  properties?: any[];
  tenants?: any[];
  isTenant?: boolean;
  onExportData?: () => void;
}

export function SettingsModalBase({
  isOpen,
  onClose,
  userName,
  setUserName,
  avatarUrl,
  setAvatarUrl,
  theme,
  setTheme,
  language,
  setLanguage,
  properties = [],
  tenants = [],
  isTenant = false,
  onExportData
}: SettingsModalBaseProps) {
  
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportError, setSupportError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  useEffect(() => {
    if (isOpen) {
      setTempName(userName);
    }
  }, [isOpen, userName]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEs = language === 'Español';
  const supportEmail = 'appgestioninmuebles@gmail.com';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setUserEmail(data.session.user.email);
      }
    });
  }, []);

  if (!isOpen) return null;

  const handleExportClick = (format: 'PDF' | 'Excel') => {
    let content = isEs ? "Reporte de Portfolio\n\n" : "Portfolio Report\n\n";
    properties.forEach(p => {
      content += `${p.title} - ${formatNumber(p.price)}€ - ${p.status}\n`;
    });
    
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Portfolio_${format}.${format === 'Excel' ? 'csv' : 'pdf'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setShowExport(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!setAvatarUrl) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveName = () => {
    if (!setUserName) return;
    if (tempName.trim()) {
      setUserName(tempName.trim());
    } else {
      setTempName(userName);
    }
    setIsEditingName(false);
  };

  const handleSendSupport = async () => {
    setIsSendingSupport(true);
    setSupportError('');
    try {
      const { data, error } = await supabase.functions.invoke('send-support-email', {
        body: {
          name: userName,
          email: userEmail,
          message: supportMessage
        }
      });
      
      if (error) {
        console.error('Error invoking edge function:', error);
        setSupportError(isEs ? 'Hubo un error de conexión al enviar el mensaje.' : 'There was a connection error sending the message.');
      } else if (data && data.error) {
        setSupportError(data.error);
      } else {
        setSupportSent(true);
      }
    } catch (err) {
      console.error('Exception calling edge function:', err);
      setSupportError(isEs ? 'Hubo un error de conexión al enviar el mensaje.' : 'There was a connection error sending the message.');
    } finally {
      setIsSendingSupport(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm(isEs ? '¿Estás seguro de que deseas cerrar sesión?' : 'Are you sure you want to log out?')) {
      onClose();
      await supabase.auth.signOut();
    }
  };

  if (showPrivacy) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={() => setShowPrivacy(false)}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
           <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-900">
             <button onClick={() => setShowPrivacy(false)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
               <ChevronLeft size={24} />
             </button>
             <h2 className="font-bold text-[16px] text-slate-900 dark:text-white ml-2">{isEs ? 'Política de Privacidad' : 'Privacy Policy'}</h2>
           </div>
           <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto prose prose-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{isEs ? 'POLÍTICA DE PRIVACIDAD DE GESTINMO' : 'GESTINMO PRIVACY POLICY'}</h3>
              <p className="mb-4"><strong>{isEs ? 'Última actualización: 1 de septiembre de 2026' : 'Last updated: September 1, 2026'}</strong></p>
              <p className="mb-6">{isEs ? 'En GestInmo nos comprometemos a proteger la privacidad y la seguridad de los datos personales de nuestros usuarios. Esta Política de Privacidad explica qué información podemos recopilar, para qué la utilizamos, cómo la protegemos y cuáles son los derechos de los usuarios.' : 'At GestInmo, we are committed to protecting the privacy and security of our users\' personal data. This Privacy Policy explains what information we may collect, what we use it for, how we protect it, and what users\' rights are.'}</p>
           </div>
        </div>
      </div>
    );
  }

  if (showManual) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={() => setShowManual(false)}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
           <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-900">
             <button onClick={() => setShowManual(false)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
               <ChevronLeft size={24} />
             </button>
             <h2 className="font-bold text-[16px] text-slate-900 dark:text-white ml-2">{isEs ? 'Manual de Uso' : 'User Manual'}</h2>
           </div>
           <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto prose prose-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{isEs ? 'Manual de Usuario' : 'User Guide'}</h3>
           </div>
        </div>
      </div>
    );
  }

  if (showSupport) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={() => { setShowSupport(false); setSupportSent(false); setSupportMessage(''); }}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
           <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-900">
             <button onClick={() => { setShowSupport(false); setSupportSent(false); setSupportMessage(''); }} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
               <ChevronLeft size={24} />
             </button>
             <h2 className="font-bold text-[16px] text-slate-900 dark:text-white ml-2">{isEs ? 'Ayuda y Soporte' : 'Help & Support'}</h2>
           </div>
           <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto bg-slate-50 dark:bg-slate-900 flex-1 flex flex-col">
              {supportSent ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <Check size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{isEs ? 'Mensaje Enviado' : 'Message Sent'}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">{isEs ? 'Nos pondremos en contacto contigo pronto en tu correo.' : 'We will get back to you soon via email.'}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-0.5">{isEs ? 'Canal directo de soporte:' : 'Direct Support Channel:'}</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">{supportEmail}</p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{isEs ? 'Cuéntanos tu consulta o problema y nuestro equipo te ayudará lo antes posible:' : 'Describe your question or issue and our team will assist you as soon as possible:'}</p>
                  
                  {supportError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                      {supportError}
                    </div>
                  )}

                  <textarea 
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder={isEs ? "Escribe tu mensaje aquí..." : "Type your message here..."}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 min-h-[150px] resize-none mb-4 shadow-sm"
                  ></textarea>
                  <button 
                    onClick={handleSendSupport}
                    disabled={!supportMessage.trim() || isSendingSupport}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Send size={18} className={isSendingSupport ? 'animate-pulse' : ''} />
                    {isSendingSupport ? (isEs ? 'Enviando...' : 'Sending...') : (isEs ? 'Enviar Mensaje a Soporte' : 'Send Message to Support')}
                  </button>
                </>
              )}
           </div>
        </div>
      </div>
    );
  }

  if (showExport) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[210] flex items-center justify-center p-4" onClick={() => setShowExport(false)}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{isEs ? 'Exportar Datos' : 'Export Data'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{isEs ? 'Selecciona el formato para descargar tu reporte:' : 'Select the format to download your report:'}</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button onClick={() => handleExportClick('PDF')} className="flex flex-col items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors">
              <FileText size={24} />
              <span className="font-bold text-sm">PDF</span>
            </button>
            <button onClick={() => handleExportClick('Excel')} className="flex flex-col items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors">
              <Table size={24} />
              <span className="font-bold text-sm">Excel</span>
            </button>
          </div>
          <button onClick={() => setShowExport(false)} className="mt-2 w-full py-2 text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">{isEs ? 'Cancelar' : 'Cancel'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-slate-900">
          <h2 className="font-bold text-[18px] text-slate-900 dark:text-white">{isEs ? 'Configuración' : 'Settings'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex-1 overflow-y-auto">
          <div className="flex flex-col items-center mb-8">
            <div 
              className={`relative mb-3 group ${setAvatarUrl ? 'cursor-pointer' : ''}`}
              onClick={() => { if (setAvatarUrl) fileInputRef.current?.click() }}
            >
              <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-400 dark:text-slate-500" />
                )}
              </div>
              {setAvatarUrl && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-800 shadow-sm hover:bg-blue-700 transition-colors pointer-events-none">
                  <Camera size={14} />
                </button>
              )}
              {setAvatarUrl && (
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              )}
            </div>

            {isEditingName && setUserName ? (
              <div className="flex items-center gap-2 mb-1">
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-lg font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-center w-48"
                  autoFocus
                />
                <button onClick={saveName} className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50">
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white">{userName || (isEs ? 'Usuario' : 'User')}</h3>
                {setUserName && (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                )}
              </div>
            )}
            
            <p className="text-sm text-slate-500 dark:text-slate-400">{userEmail || ''}</p>
            
            {!isTenant && (
              <div className="flex gap-4 mt-6 w-full">
                <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{properties.length}</div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-1">{isEs ? 'Inmuebles' : 'Properties'}</div>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{tenants.length}</div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-1">{isEs ? 'Inquilinos' : 'Tenants'}</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{isEs ? 'Ajustes del Sistema' : 'System Settings'}</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {theme === 'Oscuro' || theme === 'Dark' ? <Moon size={16}/> : <Sun size={16}/>}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Tema Oscuro' : 'Dark Mode'}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTheme(theme === 'Oscuro' || theme === 'Dark' ? 'Claro' : 'Oscuro')}
                    className={`relative w-14 h-7 rounded-full transition-colors flex items-center shadow-inner ${theme === 'Oscuro' || theme === 'Dark' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out flex items-center justify-center ${theme === 'Oscuro' || theme === 'Dark' ? 'translate-x-8 text-emerald-500' : 'translate-x-1 text-slate-400'}`}>
                      {theme === 'Oscuro' || theme === 'Dark' ? <Moon size={12} strokeWidth={3} /> : <Sun size={12} strokeWidth={3} />}
                    </div>
                  </button>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Globe size={16}/></div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Idioma' : 'Language'}</div>
                    </div>
                  </div>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="text-sm border-none bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer rounded-lg px-2 py-1 font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors"
                  >
                    <option value="Español">Español</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{isEs ? 'Datos y Soporte' : 'Data & Support'}</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {!isTenant && onExportData && (
                  <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left" onClick={onExportData}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><Download size={16}/></div>
                      <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Extraer datos' : 'Extract data'}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400"/>
                  </button>
                )}
                <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left" onClick={() => setShowManual(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><Book size={16}/></div>
                    <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Manual de Uso' : 'User Manual'}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400"/>
                </button>

                <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left" onClick={() => setShowSupport(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400"><Mail size={16}/></div>
                    <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Ayuda y Soporte' : 'Help & Support'}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400"/>
                </button>

                <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left" onClick={() => setShowPrivacy(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400"><Shield size={16}/></div>
                    <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Política de Privacidad' : 'Privacy Policy'}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400"/>
                </button>

              </div>
            </div>
            
            {/* Cerrar sesión integrado */}
            <div className="mt-8">
              <button 
                onClick={handleLogout}
                className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
              >
                <LogOut size={18} />
                {isEs ? 'Cerrar Sesión' : 'Sign Out'}
              </button>
            </div>

            <div className="pb-8 pt-6 text-center">
               <p className="text-[11px] text-slate-400 font-medium">{isEs ? 'Versión' : 'Version'} 1.1.0 (Build 2026)</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const context = useAppContext();
  
  return (
    <SettingsModalBase 
      isOpen={isOpen}
      onClose={onClose}
      userName={context.userName}
      setUserName={context.setUserName}
      avatarUrl={context.avatarUrl}
      setAvatarUrl={context.setAvatarUrl}
      theme={context.theme}
      setTheme={context.setTheme}
      language={context.language}
      setLanguage={context.setLanguage}
      isTenant={false}
      onExportData={() => {
        const currentYear = new Date().getFullYear();
        exportYearlyDataPDF(currentYear, context.properties, context.getDynamicTransactions(), context.language);
      }}
    />
  );
}
