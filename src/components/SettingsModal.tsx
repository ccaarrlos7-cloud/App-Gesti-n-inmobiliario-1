import { formatNumber } from "../utils";
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Moon, Globe, Bell, Download, Book, Mail, Shield, ChevronRight, ChevronLeft, User, X, Check, FileText, Table, Send, Sun, LogOut, Building2, ShieldCheck, AlertTriangle, Umbrella } from 'lucide-react';
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

  // --- Servicios para ti ---
  type ServiceType = 'hipotecas' | 'impago' | 'morosidad' | 'seguros' | 'seguro-hogar' | null;
  const [activeService, setActiveService] = useState<ServiceType>(null);
  const [serviceSent, setServiceSent] = useState(false);
  const [isSendingService, setIsSendingService] = useState(false);
  const [serviceError, setServiceError] = useState('');
  // Shared fields
  const [svcPhone, setSvcPhone] = useState('');
  const [svcMessage, setSvcMessage] = useState('');
  // Hipotecas
  const [svcOpType, setSvcOpType] = useState('');
  const [svcAmount, setSvcAmount] = useState('');
  // Impago
  const [svcProperty, setSvcProperty] = useState('');
  const [svcRent, setSvcRent] = useState('');
  const [svcTenantInfo, setSvcTenantInfo] = useState('');
  // Morosidad
  const [svcNeed, setSvcNeed] = useState('');
  // Seguros
  const [svcInsuranceType, setSvcInsuranceType] = useState('');
  // Seguro de hogar (inquilino)
  const [svcHomeType, setSvcHomeType] = useState('');

  const resetServiceForm = () => {
    setServiceSent(false);
    setServiceError('');
    setSvcPhone('');
    setSvcMessage('');
    setSvcOpType('');
    setSvcAmount('');
    setSvcProperty('');
    setSvcRent('');
    setSvcTenantInfo('');
    setSvcNeed('');
    setSvcInsuranceType('');
    setSvcHomeType('');
  };

  const closeService = () => { setActiveService(null); resetServiceForm(); };

  const serviceTitle = (s: ServiceType, es: boolean): string => {
    if (s === 'hipotecas')    return es ? 'Hipotecas' : 'Mortgages';
    if (s === 'impago')       return es ? 'Seguro de Impago' : 'Non-Payment Insurance';
    if (s === 'morosidad')    return es ? 'Certificado / Consulta de Morosidad' : 'Default Certificate';
    if (s === 'seguros')      return es ? 'Seguros' : 'Insurance';
    if (s === 'seguro-hogar') return es ? 'Seguro de Hogar' : 'Home Insurance';
    return '';
  };

  const serviceSubject = (s: ServiceType): string => {
    if (s === 'hipotecas')    return 'Solicitud de información hipotecaria';
    if (s === 'impago')       return 'Solicitud de seguro de impago';
    if (s === 'morosidad')    return 'Solicitud de certificado/consulta de morosidad';
    if (s === 'seguros')      return 'Solicitud de información sobre seguros';
    if (s === 'seguro-hogar') return 'Solicitud de seguro de hogar para inquilino';
    return '';
  };

  const handleSendService = async () => {
    setIsSendingService(true);
    setServiceError('');
    try {
      let body = `SERVICIO: ${serviceSubject(activeService)}\n\n`;
      body += `Nombre: ${userName}\n`;
      body += `Email: ${userEmail}\n`;
      if (svcPhone) body += `Teléfono: ${svcPhone}\n`;
      if (activeService === 'hipotecas') {
        if (svcOpType)  body += `Tipo de operación: ${svcOpType}\n`;
        if (svcAmount)  body += `Importe aproximado: ${svcAmount}\n`;
      }
      if (activeService === 'impago') {
        if (svcProperty)    body += `Inmueble: ${svcProperty}\n`;
        if (svcRent)        body += `Alquiler mensual: ${svcRent}\n`;
        if (svcTenantInfo)  body += `Información del inquilino: ${svcTenantInfo}\n`;
      }
      if (activeService === 'morosidad') {
        if (svcNeed)        body += `Qué necesita: ${svcNeed}\n`;
        if (svcProperty)    body += `Inmueble / Inquilino: ${svcProperty}\n`;
      }
      if (activeService === 'seguros') {
        if (svcInsuranceType) body += `Tipo de seguro: ${svcInsuranceType}\n`;
        if (svcProperty)      body += `Inmueble: ${svcProperty}\n`;
      }
      if (activeService === 'seguro-hogar') {
        if (svcProperty)  body += `Inmueble / Dirección: ${svcProperty}\n`;
        if (svcHomeType)  body += `Tipo de vivienda: ${svcHomeType}\n`;
      }
      if (svcMessage) body += `\nInformación adicional:\n${svcMessage}`;

      const { data, error } = await supabase.functions.invoke('send-support-email', {
        body: { name: userName, email: userEmail, message: body }
      });
      if (error || (data && data.error)) {
        setServiceError(isEs ? 'Hubo un error al enviar la solicitud.' : 'There was an error sending your request.');
      } else {
        setServiceSent(true);
      }
    } catch {
      setServiceError(isEs ? 'Hubo un error de conexión.' : 'Connection error.');
    } finally {
      setIsSendingService(false);
    }
  };
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{isEs ? 'POLÍTICA DE PRIVACIDAD' : 'PRIVACY POLICY'}</h3>
              <p className="mb-4"><strong>{isEs ? 'Última actualización: Septiembre de 2026' : 'Last updated: September 2026'}</strong></p>
              <p className="mb-4">{isEs ? 'GestInmo garantiza la seguridad y privacidad de los datos personales. Esta aplicación ha sido desarrollada como herramienta de gestión privada y no comparte información con terceros no autorizados.' : 'GestInmo guarantees the security and privacy of personal data. This application has been developed as a private management tool and does not share information with unauthorized third parties.'}</p>
              <p className="mb-4">{isEs ? 'Los datos introducidos o recopilados a través de esta plataforma (incluyendo datos de contacto, contratos de alquiler, recibos y documentos adjuntos) son accesibles únicamente por el propietario administrador y los inquilinos vinculados a sus respectivos contratos.' : 'The data entered or collected through this platform (including contact details, rental contracts, receipts and attached documents) are accessible only by the managing owner and the tenants linked to their respective contracts.'}</p>
              <p className="mb-6">{isEs ? 'Como usuario, usted tiene derecho a consultar, rectificar o eliminar su información de perfil. Cualquier consulta relacionada con sus datos, por favor, póngase en contacto a través de la sección de Ayuda y Soporte.' : 'As a user, you have the right to view, rectify or delete your profile information. For any queries regarding your data, please contact through the Help & Support section.'}</p>
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{isEs ? 'Manual del Inquilino' : 'Tenant Guide'}</h3>
              
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">{isEs ? '1. Inicio' : '1. Home'}</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'En la pantalla principal puedes consultar tu inmueble asignado.' : 'On the main screen you can check your assigned property.'}</li>
                <li>{isEs ? 'Visualiza la renta mensual, el importe de la fianza, y las fechas de inicio y finalización de tu contrato.' : 'View the monthly rent, deposit amount, and the start and end dates of your contract.'}</li>
                <li>{isEs ? 'Comprueba rápidamente tu "Estado del pago" (Al día, Pendiente o En deuda).' : 'Quickly check your "Payment status" (Up to date, Pending or Debt).'}</li>
              </ul>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">{isEs ? '2. Documentos' : '2. Documents'}</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Accede a la pestaña "Documentos" para ver tu contrato de alquiler y cualquier otro documento compartido por el propietario.' : 'Go to the "Documents" tab to view your rental contract and any other document shared by the landlord.'}</li>
                <li>{isEs ? 'Usa los botones junto a cada archivo para visualizarlo o descargarlo a tu dispositivo.' : 'Use the buttons next to each file to view or download it to your device.'}</li>
              </ul>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">{isEs ? '3. Incidencias' : '3. Issues'}</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Para crear una nueva incidencia (por ejemplo, una avería), ve a la pestaña "Incidencias" y pulsa en "Nueva".' : 'To create a new issue (e.g. a breakdown), go to the "Issues" tab and click "New".'}</li>
                <li>{isEs ? 'Podrás consultar todas tus incidencias pasadas y su estado.' : 'You can check all your past issues and their status.'}</li>
                <li>{isEs ? 'Pulsa sobre cualquier incidencia para ver el historial y comunicarte con el propietario al respecto.' : 'Click on any issue to see the history and communicate with the landlord about it.'}</li>
              </ul>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">{isEs ? '4. Chat' : '4. Chat'}</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'La pestaña "Chat" te permite comunicarte de forma directa con tu propietario para asuntos generales.' : 'The "Chat" tab allows you to communicate directly with your landlord for general matters.'}</li>
                <li>{isEs ? 'El indicador rojo sobre el icono del chat te avisará cuando tengas mensajes no leídos.' : 'The red indicator over the chat icon will alert you when you have unread messages.'}</li>
              </ul>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">{isEs ? '5. Perfil y configuración' : '5. Profile & Settings'}</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Toca tu foto o icono de usuario en la esquina superior derecha para abrir tu Perfil.' : 'Tap your photo or user icon in the top right corner to open your Profile.'}</li>
                <li>{isEs ? 'Puedes cambiar el idioma de la plataforma y el tema (claro u oscuro).' : 'You can change the platform language and theme (light or dark).'}</li>
                <li>{isEs ? 'Utiliza el botón "Cerrar sesión" en la parte inferior de la configuración para salir de la aplicación de forma segura.' : 'Use the "Sign Out" button at the bottom of the settings to safely exit the application.'}</li>
              </ul>
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
                  <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl text-xs text-slate-800 dark:text-slate-400">
                    <p className="font-semibold mb-0.5">{isEs ? 'Canal directo de soporte:' : 'Direct Support Channel:'}</p>
                    <p className="font-bold text-slate-900 dark:text-white dark:text-[#FACC15]">{supportEmail}</p>
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-500 min-h-[150px] resize-none mb-4 shadow-sm"
                  ></textarea>
                  <button 
                    onClick={handleSendSupport}
                    disabled={!supportMessage.trim() || isSendingSupport}
                    className="w-full py-3.5 bg-[#FACC15] hover:bg-[#eab308] text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

  // ─── Servicios panel ───────────────────────────────────────────────────────
  if (activeService && (!isTenant || activeService === 'seguro-hogar')) {
    const title = serviceTitle(activeService, isEs);
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end" onClick={closeService}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
          <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-900">
            <button onClick={closeService} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronLeft size={24} />
            </button>
            <h2 className="font-bold text-[16px] text-slate-900 dark:text-white ml-2 truncate">{title}</h2>
          </div>

          <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto bg-slate-50 dark:bg-slate-900 flex-1 flex flex-col">
            {serviceSent ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{isEs ? 'Solicitud Enviada' : 'Request Sent'}</h3>
                <p className="text-slate-500 dark:text-slate-400">{isEs ? 'Nos pondremos en contacto contigo pronto.' : 'We will get back to you soon.'}</p>
              </div>
            ) : (
              <>
                {serviceError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                    {serviceError}
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  {/* Phone – common */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Teléfono de contacto (opcional)' : 'Contact phone (optional)'}</label>
                    <input type="tel" value={svcPhone} onChange={e => setSvcPhone(e.target.value)}
                      placeholder={isEs ? 'Tu teléfono...' : 'Your phone...'}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] focus:ring-1 focus:ring-[#FACC15] transition-colors shadow-sm" />
                  </div>

                  {/* Hipotecas-specific */}
                  {activeService === 'hipotecas' && (<>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Tipo de operación' : 'Operation type'}</label>
                      <select value={svcOpType} onChange={e => setSvcOpType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm">
                        <option value="">{isEs ? 'Selecciona...' : 'Select...'}</option>
                        <option value="Compra de vivienda">{isEs ? 'Compra de vivienda' : 'Home purchase'}</option>
                        <option value="Mejora de condiciones">{isEs ? 'Mejora de condiciones' : 'Better terms'}</option>
                        <option value="Ampliación">{isEs ? 'Ampliación' : 'Extension'}</option>
                        <option value="Otro">{isEs ? 'Otro' : 'Other'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Importe aproximado' : 'Approximate amount'}</label>
                      <input type="text" value={svcAmount} onChange={e => setSvcAmount(e.target.value)}
                        placeholder={isEs ? 'Ej: 180.000 €' : 'E.g. 180,000 €'}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm" />
                    </div>
                  </>)}

                  {/* Impago-specific */}
                  {activeService === 'impago' && (<>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Inmueble' : 'Property'}</label>
                      <input type="text" value={svcProperty} onChange={e => setSvcProperty(e.target.value)}
                        placeholder={isEs ? 'Dirección o referencia...' : 'Address or reference...'}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Alquiler mensual' : 'Monthly rent'}</label>
                      <input type="text" value={svcRent} onChange={e => setSvcRent(e.target.value)}
                        placeholder={isEs ? 'Ej: 900 €/mes' : 'E.g. 900 €/mo'}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Información del inquilino (opcional)' : 'Tenant info (optional)'}</label>
                      <input type="text" value={svcTenantInfo} onChange={e => setSvcTenantInfo(e.target.value)}
                        placeholder={isEs ? 'Nombre, situación...' : 'Name, situation...'}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm" />
                    </div>
                  </>)}

                  {/* Morosidad-specific */}
                  {activeService === 'morosidad' && (<>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? '¿Qué necesitas exactamente?' : 'What do you need?'}</label>
                      <select value={svcNeed} onChange={e => setSvcNeed(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm">
                        <option value="">{isEs ? 'Selecciona...' : 'Select...'}</option>
                        <option value="Certificado de morosidad">{isEs ? 'Certificado de morosidad' : 'Default certificate'}</option>
                        <option value="Consulta sobre inquilino">{isEs ? 'Consulta sobre inquilino' : 'Tenant inquiry'}</option>
                        <option value="Ambos">{isEs ? 'Ambos' : 'Both'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Inmueble / Inquilino (opcional)' : 'Property / Tenant (optional)'}</label>
                      <input type="text" value={svcProperty} onChange={e => setSvcProperty(e.target.value)}
                        placeholder={isEs ? 'Dirección, nombre...' : 'Address, name...'}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm" />
                    </div>
                  </>)}

                  {/* Seguros-specific */}
                  {activeService === 'seguros' && (<>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Tipo de seguro' : 'Insurance type'}</label>
                      <select value={svcInsuranceType} onChange={e => setSvcInsuranceType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm">
                        <option value="">{isEs ? 'Selecciona...' : 'Select...'}</option>
                        <option value="Seguro del hogar">{isEs ? 'Seguro del hogar' : 'Home insurance'}</option>
                        <option value="Seguro de comunidad">{isEs ? 'Seguro de comunidad' : 'Community insurance'}</option>
                        <option value="Seguro de responsabilidad civil">{isEs ? 'Responsabilidad civil' : 'Liability insurance'}</option>
                        <option value="Otro">{isEs ? 'Otro' : 'Other'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Inmueble (opcional)' : 'Property (optional)'}</label>
                      <input type="text" value={svcProperty} onChange={e => setSvcProperty(e.target.value)}
                        placeholder={isEs ? 'Dirección o referencia...' : 'Address or reference...'}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm" />
                    </div>
                  </>)}

                  {/* Seguro de hogar (inquilino)-specific */}
                  {activeService === 'seguro-hogar' && (<>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Inmueble / Dirección' : 'Property / Address'}</label>
                      <input type="text" value={svcProperty} onChange={e => setSvcProperty(e.target.value)}
                        placeholder={isEs ? 'Dirección del inmueble...' : 'Property address...'}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Tipo de vivienda' : 'Property type'}</label>
                      <select value={svcHomeType} onChange={e => setSvcHomeType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] transition-colors shadow-sm">
                        <option value="">{isEs ? 'Selecciona...' : 'Select...'}</option>
                        <option value="Piso">{isEs ? 'Piso' : 'Apartment'}</option>
                        <option value="Casa / Chalet">{isEs ? 'Casa / Chalet' : 'House'}</option>
                        <option value="Estudio">{isEs ? 'Estudio' : 'Studio'}</option>
                        <option value="Otro">{isEs ? 'Otro' : 'Other'}</option>
                      </select>
                    </div>
                  </>)}

                  {/* Additional message – common */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{isEs ? 'Información adicional (opcional)' : 'Additional info (optional)'}</label>
                    <textarea value={svcMessage} onChange={e => setSvcMessage(e.target.value)}
                      placeholder={isEs ? 'Cuéntanos más detalles...' : 'Tell us more details...'}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-[#FACC15] focus:ring-1 focus:ring-[#FACC15] min-h-[100px] resize-none transition-colors shadow-sm" />
                  </div>
                </div>

                <button
                  onClick={handleSendService}
                  disabled={isSendingService}
                  className="w-full py-3.5 bg-[#FACC15] hover:bg-[#eab308] text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={18} className={isSendingService ? 'animate-pulse' : ''} />
                  {isSendingService ? (isEs ? 'Enviando...' : 'Sending...') : (isEs ? 'Enviar Solicitud' : 'Send Request')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

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
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#FACC15] rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-800 shadow-sm hover:bg-[#eab308] transition-colors pointer-events-none">
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
                  className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-lg font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none focus:border-slate-500 text-center w-48"
                  autoFocus
                />
                <button onClick={saveName} className="p-1.5 bg-slate-200 dark:bg-slate-700 dark:bg-slate-800/50 text-slate-900 dark:text-white dark:text-[#FACC15] rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700/50">
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white">{userName || (isEs ? 'Usuario' : 'User')}</h3>
                {setUserName && (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-[#FACC15] transition-colors p-1"
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

            {/* ─── Servicios para ti (inquilino) ─── */}
            {isTenant && (
              <div>
                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  {isEs ? 'Servicios para ti' : 'Services for You'}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => { resetServiceForm(); setActiveService('seguro-hogar'); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left hover:border-[#FACC15] hover:shadow-md transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-500 shrink-0 group-hover:bg-[#FACC15]/20 transition-colors">
                        <Umbrella size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[14px] text-slate-900 dark:text-white mb-0.5">{isEs ? 'Seguro de Hogar' : 'Home Insurance'}</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug">{isEs ? 'Solicita información sobre un seguro de hogar adaptado a tus necesidades como inquilino.' : 'Request information on home insurance tailored to your needs as a tenant.'}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 shrink-0" />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ─── Servicios para ti (propietario) ─── */}
            {!isTenant && (
              <div>
                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  {isEs ? 'Servicios para ti' : 'Services for You'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Hipotecas */}
                  <button
                    onClick={() => { resetServiceForm(); setActiveService('hipotecas'); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left hover:border-[#FACC15] hover:shadow-md transition-all group shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 mb-3 group-hover:bg-[#FACC15]/20 transition-colors">
                      <Building2 size={18} />
                    </div>
                    <p className="font-bold text-[13px] text-slate-900 dark:text-white mb-1">{isEs ? 'Hipotecas' : 'Mortgages'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{isEs ? 'Solicita asesoramiento hipotecario personalizado.' : 'Get personalised mortgage advice.'}</p>
                  </button>

                  {/* Seguro de impago */}
                  <button
                    onClick={() => { resetServiceForm(); setActiveService('impago'); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left hover:border-[#FACC15] hover:shadow-md transition-all group shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-3 group-hover:bg-[#FACC15]/20 transition-colors">
                      <ShieldCheck size={18} />
                    </div>
                    <p className="font-bold text-[13px] text-slate-900 dark:text-white mb-1">{isEs ? 'Seguro de Impago' : 'Non-Payment Insurance'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{isEs ? 'Protege tus rentas ante impagos del inquilino.' : 'Protect your rent from tenant defaults.'}</p>
                  </button>

                  {/* Morosidad */}
                  <button
                    onClick={() => { resetServiceForm(); setActiveService('morosidad'); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left hover:border-[#FACC15] hover:shadow-md transition-all group shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-3 group-hover:bg-[#FACC15]/20 transition-colors">
                      <AlertTriangle size={18} />
                    </div>
                    <p className="font-bold text-[13px] text-slate-900 dark:text-white mb-1">{isEs ? 'Consulta de Morosidad' : 'Default Certificate'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{isEs ? 'Verifica la solvencia antes de alquilar.' : 'Check creditworthiness before renting.'}</p>
                  </button>

                  {/* Seguros */}
                  <button
                    onClick={() => { resetServiceForm(); setActiveService('seguros'); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left hover:border-[#FACC15] hover:shadow-md transition-all group shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 mb-3 group-hover:bg-[#FACC15]/20 transition-colors">
                      <Umbrella size={18} />
                    </div>
                    <p className="font-bold text-[13px] text-slate-900 dark:text-white mb-1">{isEs ? 'Seguros' : 'Insurance'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{isEs ? 'Información sobre seguros para tus inmuebles.' : 'Info on insurance for your properties.'}</p>
                  </button>
                </div>
              </div>
            )}
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
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 dark:bg-slate-800/40 flex items-center justify-center text-slate-900 dark:text-white dark:text-[#FACC15]"><Download size={16}/></div>
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
      properties={context.properties}
      tenants={context.tenants}
      isTenant={false}
      onExportData={() => {
        const currentYear = new Date().getFullYear();
        exportYearlyDataPDF(currentYear, context.properties, context.getDynamicTransactions(), context.language);
      }}
    />
  );
}
