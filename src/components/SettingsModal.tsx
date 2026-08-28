import { formatNumber } from "../utils";
import React, { useState, useRef } from 'react';
import { Camera, Moon, Globe, Bell, Download, Book, Mail, Shield, ChevronRight, ChevronLeft, User, X, Check, FileText, Table, Send, Sun, LogOut } from 'lucide-react';
import { useAppContext } from '../store';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { properties, tenants, userName, setUserName, avatarUrl, setAvatarUrl, theme, setTheme, language, setLanguage } = useAppContext();
  
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEs = language === 'Español';

  if (!isOpen) return null;

  const handleExportClick = (format: 'PDF' | 'Excel') => {
    // Generate dummy content for the file to force a real download without getting stuck
    let content = "Reporte de Portfolio\n\n";
    properties.forEach(p => {
      content += `${p.title} - ${formatNumber(p.price)}€ - ${p.status}\n`;
    });
    
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Portfolio_${format}.${format === 'Excel' ? 'csv' : 'pdf'}`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);

    setShowExport(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (tempName.trim()) {
      setUserName(tempName.trim());
    } else {
      setTempName(userName);
    }
    setIsEditingName(false);
  };

  if (showPrivacy) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={() => setShowPrivacy(false)}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
           <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-900">
             <button onClick={() => setShowPrivacy(false)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
               <ChevronLeft size={24} />
             </button>
             <h2 className="font-bold text-[16px] text-slate-900 dark:text-white ml-2">{isEs ? 'Política de Privacidad' : 'Privacy Policy'}</h2>
           </div>
           <div className="p-6 overflow-y-auto prose prose-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Términos y Política de Privacidad</h3>
              <p className="mb-4"><strong>Última actualización: 25 de Agosto, 2026</strong></p>
              <p className="mb-6">En nuestra aplicación, la privacidad y seguridad de sus datos personales y financieros es nuestra máxima prioridad. Esta política detalla cómo recopilamos, usamos y protegemos su información de acuerdo con las normativas vigentes.</p>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">1. Datos que recopilamos</h4>
              <p className="mb-2">Recopilamos información que usted proporciona directamente al usar la plataforma, incluyendo:</p>
              <ul className="list-disc pl-5 mb-6 space-y-1">
                <li>Datos de perfil (Nombre, correo electrónico, foto).</li>
                <li>Datos financieros y de propiedades (rentas, gastos, valores de adquisición, hipotecas).</li>
                <li>Información de inquilinos y contratos de arrendamiento.</li>
              </ul>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">2. Uso de la Información</h4>
              <p className="mb-6">Utilizamos sus datos exclusivamente para proveer el servicio de gestión de su portfolio inmobiliario, generar analíticas financieras, facilitar el control de cobros y enviarle notificaciones relevantes sobre pagos o vencimientos.</p>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">3. Protección y Seguridad</h4>
              <p className="mb-6">Implementamos medidas de seguridad técnicas y organizativas robustas (incluyendo cifrado de datos en reposo y en tránsito) para proteger sus datos contra acceso no autorizado, alteración, divulgación o destrucción.</p>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">4. Compartir Información</h4>
              <p className="mb-6">No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines comerciales. Sus datos solo pueden ser compartidos cuando sea estrictamente requerido por la ley aplicable.</p>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">5. Sus Derechos</h4>
              <p className="mb-6">Usted tiene el derecho de acceder, corregir, exportar (en formato CSV, PDF o Excel) o eliminar sus datos personales en cualquier momento a través de los ajustes de su cuenta, o contactando con nuestro equipo de soporte de la empresa.</p>
           </div>
        </div>
      </div>
    );
  }

  if (showManual) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={() => setShowManual(false)}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
           <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-900">
             <button onClick={() => setShowManual(false)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
               <ChevronLeft size={24} />
             </button>
             <h2 className="font-bold text-[16px] text-slate-900 dark:text-white ml-2">{isEs ? 'Manual de Uso' : 'User Manual'}</h2>
           </div>
           <div className="p-6 overflow-y-auto prose prose-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Manual de Usuario</h3>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">1. Inicio (Dashboard)</h4>
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80" alt="Dashboard Ejemplo" className="rounded-xl w-full h-32 object-cover mb-3" />
              <p className="mb-4">Visualiza un resumen rápido de tus ingresos y gastos mensuales, la tasa de ocupación de tu portfolio y el beneficio neto anual estimado de todas tus propiedades.</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">2. Portfolio</h4>
              <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=500&q=80" alt="Portfolio Ejemplo" className="rounded-xl w-full h-32 object-cover mb-3" />
              <p className="mb-4">Añade, edita y revisa todas tus propiedades. Puedes adjuntar enlaces a tus contratos, escrituras e hipotecas directamente en la ficha de cada propiedad. Filtra rápidamente por estado (Ocupado, Vacío, etc.).</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">3. Inquilinos (CRM)</h4>
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=80" alt="CRM Ejemplo" className="rounded-xl w-full h-32 object-cover mb-3" />
              <p className="mb-4">Gestiona a las personas que alquilan tus propiedades. Lleva un control anual de los pagos mes a mes (Al día, Pendiente, Deuda) y revisa sus contratos vinculados.</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">4. Configuración</h4>
              <p className="mb-4">Desde tu perfil, edita tu nombre y foto. Cambia el tema (Claro u Oscuro) o el idioma. Exporta la información a PDF o Excel, y contacta con el soporte de la empresa si tienes alguna incidencia.</p>
           </div>
        </div>
      </div>
    );
  }

  if (showSupport) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={() => { setShowSupport(false); setSupportSent(false); setSupportMessage(''); }}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
           <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-900">
             <button onClick={() => { setShowSupport(false); setSupportSent(false); setSupportMessage(''); }} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
               <ChevronLeft size={24} />
             </button>
             <h2 className="font-bold text-[16px] text-slate-900 dark:text-white ml-2">{isEs ? 'Ayuda y Soporte' : 'Help & Support'}</h2>
           </div>
           <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 flex-1 flex flex-col">
              {supportSent ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <Check size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{isEs ? 'Mensaje Enviado' : 'Message Sent'}</h3>
                  <p className="text-slate-500 dark:text-slate-400">{isEs ? 'Nos pondremos en contacto contigo pronto.' : 'We will get back to you soon.'}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{isEs ? 'Cuéntanos tu problema y nuestro equipo te ayudará lo antes posible.' : 'Tell us your issue and our team will help you as soon as possible.'}</p>
                  <textarea 
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder={isEs ? "¿En qué podemos ayudarte?" : "How can we help you?"}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 min-h-[150px] resize-none mb-4 shadow-sm"
                  ></textarea>
                  <button 
                    onClick={() => setSupportSent(true)}
                    disabled={!supportMessage.trim()}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Send size={18} />
                    {isEs ? 'Enviar Mensaje' : 'Send Message'}
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
          <button onClick={() => setShowExport(false)} className="mt-2 w-full py-2 text-slate-500 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">{isEs ? 'Cancelar' : 'Cancel'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-slate-900">
          <h2 className="font-bold text-[18px] text-slate-900 dark:text-white">{isEs ? 'Configuración' : 'Settings'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Profile Section */}
          <div className="flex flex-col items-center mb-8">
            <div 
              className="relative mb-3 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-800 shadow-sm hover:bg-blue-700 transition-colors pointer-events-none">
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>

            {isEditingName ? (
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                {userName}
                <span className="opacity-0 group-hover:opacity-100 text-slate-400 text-xs font-normal underline">{isEs ? 'Editar' : 'Edit'}</span>
              </h2>
            )}
            
            <p className="text-sm text-slate-500 dark:text-slate-400">ccaarrlos7@gmail.com</p>
            
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
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            
            {/* Ajustes del Sistema */}
            <div>
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{isEs ? 'Ajustes del Sistema' : 'System Settings'}</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                  
                {/* Tema */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {theme === 'Oscuro' ? <Moon size={16}/> : <Sun size={16}/>}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Tema Oscuro' : 'Dark Mode'}</div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">{isEs ? 'Apariencia visual' : 'Visual appearance'}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTheme(theme === 'Oscuro' ? 'Claro' : 'Oscuro')}
                    className={`relative w-14 h-7 rounded-full transition-colors flex items-center shadow-inner ${theme === 'Oscuro' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out flex items-center justify-center ${theme === 'Oscuro' ? 'translate-x-8 text-emerald-500' : 'translate-x-1 text-slate-400'}`}>
                      {theme === 'Oscuro' ? <Moon size={12} strokeWidth={3} /> : <Sun size={12} strokeWidth={3} />}
                    </div>
                  </button>
                </div>

                {/* Idioma */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Globe size={16}/></div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Idioma' : 'Language'}</div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">{isEs ? 'Español o Inglés' : 'English or Spanish'}</div>
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

                {/* Notificaciones */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Bell size={16}/></div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Notificaciones Push' : 'Push Notifications'}</div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">{isEs ? 'Avisos de cobros y estados' : 'Payment and status alerts'}</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

              </div>
            </div>

            {/* Datos y Ayuda */}
            <div>
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{isEs ? 'Datos y Soporte' : 'Data & Support'}</h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                  
                <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left" onClick={() => setShowExport(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><Download size={16}/></div>
                    <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Exportar Datos' : 'Export Data'}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400"/>
                </button>

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
            
            <div className="mt-8">
              <button 
                onClick={() => {
                  if (window.confirm(isEs ? '¿Seguro que quieres cerrar sesión?' : 'Are you sure you want to log out?')) {
                    window.location.reload();
                  }
                }}
                className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
              >
                <LogOut size={18} />
                {isEs ? 'Salir del usuario' : 'Sign Out'}
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
