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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{isEs ? 'POLÍTICA DE PRIVACIDAD — GestiCasa' : 'PRIVACY POLICY — GestiCasa'}</h3>
              <p className="mb-4 text-xs text-slate-400">{isEs ? 'Última actualización: Septiembre de 2026' : 'Last updated: September 2026'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '1. Responsable del tratamiento' : '1. Data Controller'}</h4>
              <p className="mb-3 text-xs">{isEs ? 'El responsable del tratamiento de sus datos personales es Carlos Gil Apps, gestor de la aplicación GestiCasa. Para cualquier consulta relacionada con la privacidad o el tratamiento de sus datos, puede contactar a través del correo electrónico: appgestioninmuebles@gmail.com' : 'The data controller responsible for processing your personal data is Carlos Gil Apps, manager of the GestiCasa application. For any queries relating to privacy or the processing of your data, you may contact us at: appgestioninmuebles@gmail.com'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '2. ¿Qué datos tratamos?' : '2. What data do we process?'}</h4>
              <p className="mb-2">{isEs ? 'GestiCasa trata los siguientes datos personales en función de su perfil:' : 'GestiCasa processes the following personal data depending on your profile:'}</p>
              {!isTenant ? (
                <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                  <li>{isEs ? 'Datos de registro y autenticación: nombre, correo electrónico y contraseña (gestionados por Supabase Auth).' : 'Registration and authentication data: name, email and password (managed by Supabase Auth).'}</li>
                  <li>{isEs ? 'Datos de inmuebles: dirección, tipo, estado, precio de compra, renta de mercado, hipoteca, fotografías o documentos vinculados.' : 'Property data: address, type, status, purchase price, market rent, mortgage, linked photos or documents.'}</li>
                  <li>{isEs ? 'Datos de inquilinos: nombre completo, DNI/NIE, teléfono, correo electrónico y cualquier otra información que el propietario introduzca.' : 'Tenant data: full name, ID number, phone, email and any other information the owner enters.'}</li>
                  <li>{isEs ? 'Datos de contratos: importe de renta, fianza, fechas de inicio y fin, cláusulas y estado de pago.' : 'Contract data: rent amount, deposit, start and end dates, clauses and payment status.'}</li>
                  <li>{isEs ? 'Transacciones: ingresos y gastos vinculados a cada inmueble.' : 'Transactions: income and expenses linked to each property.'}</li>
                  <li>{isEs ? 'Documentos: contratos, recibos, certificados y cualquier archivo subido por el propietario o compartido con el inquilino.' : 'Documents: contracts, receipts, certificates and any file uploaded by the owner or shared with the tenant.'}</li>
                  <li>{isEs ? 'Incidencias: título, descripción, estado y mensajes de seguimiento.' : 'Issues: title, description, status and follow-up messages.'}</li>
                  <li>{isEs ? 'Comunicaciones: mensajes de chat entre propietario e inquilino.' : 'Communications: chat messages between owner and tenant.'}</li>
                  <li>{isEs ? 'Solicitudes de servicio: información proporcionada al solicitar hipotecas, seguros o consultas de morosidad.' : 'Service requests: information provided when requesting mortgages, insurance or default checks.'}</li>
                </ul>
              ) : (
                <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                  <li>{isEs ? 'Datos de registro y autenticación: correo electrónico y contraseña (gestionados por Supabase Auth).' : 'Registration and authentication data: email and password (managed by Supabase Auth).'}</li>
                  <li>{isEs ? 'Datos del perfil: nombre, teléfono y cualquier información que el propietario haya asociado a su contrato.' : 'Profile data: name, phone and any information the owner has linked to your contract.'}</li>
                  <li>{isEs ? 'Datos del contrato de alquiler: inmueble, renta, fianza, fechas y estado de pago.' : 'Rental contract data: property, rent, deposit, dates and payment status.'}</li>
                  <li>{isEs ? 'Documentos: contrato de alquiler y documentos compartidos por el propietario o subidos por el propio inquilino.' : 'Documents: rental contract and documents shared by the owner or uploaded by the tenant.'}</li>
                  <li>{isEs ? 'Incidencias: descripción de avisos o averías y mensajes de seguimiento.' : 'Issues: description of notices or breakdowns and follow-up messages.'}</li>
                  <li>{isEs ? 'Comunicaciones: mensajes de chat con el propietario.' : 'Communications: chat messages with the landlord.'}</li>
                  <li>{isEs ? 'Solicitudes de servicio: información proporcionada al solicitar un seguro de hogar.' : 'Service requests: information provided when requesting home insurance.'}</li>
                </ul>
              )}

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '3. Finalidades del tratamiento' : '3. Purposes of processing'}</h4>
              <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                <li>{isEs ? 'Gestionar la relación entre propietario e inquilino.' : 'Managing the relationship between landlord and tenant.'}</li>
                <li>{isEs ? 'Permitir el seguimiento de contratos, pagos y documentación.' : 'Allowing monitoring of contracts, payments and documentation.'}</li>
                <li>{isEs ? 'Gestionar y resolver incidencias del inmueble.' : 'Managing and resolving property issues.'}</li>
                <li>{isEs ? 'Facilitar la comunicación directa entre propietario e inquilino.' : 'Facilitating direct communication between owner and tenant.'}</li>
                <li>{isEs ? 'Tramitar solicitudes de servicios adicionales (seguros, hipotecas, consultas de morosidad).' : 'Processing requests for additional services (insurance, mortgages, default checks).'}</li>
                <li>{isEs ? 'Garantizar la seguridad y el correcto funcionamiento de la plataforma.' : 'Ensuring the security and proper operation of the platform.'}</li>
                <li>{isEs ? 'Atender consultas y solicitudes de soporte.' : 'Handling support queries and requests.'}</li>
              </ul>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '4. Base jurídica' : '4. Legal basis'}</h4>
              <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                <li>{isEs ? 'Ejecución de la relación contractual entre propietario e inquilino (art. 6.1.b RGPD).' : 'Performance of the contractual relationship between landlord and tenant (Art. 6.1.b GDPR).'}</li>
                <li>{isEs ? 'Interés legítimo del propietario en gestionar su patrimonio inmobiliario (art. 6.1.f RGPD).' : "Legitimate interest of the owner in managing their real estate assets (Art. 6.1.f GDPR)."}</li>
                <li>{isEs ? 'Consentimiento del usuario para la prestación de servicios adicionales (art. 6.1.a RGPD).' : 'User consent for the provision of additional services (Art. 6.1.a GDPR).'}</li>
              </ul>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '5. Acceso a los datos' : '5. Data access'}</h4>
              <p className="mb-3 text-xs">{isEs ? 'Los datos introducidos en GestiCasa son accesibles únicamente por el propietario administrador de cada cuenta y por los inquilinos vinculados a sus respectivos contratos. No se comparte información personal con terceros no autorizados.' : 'Data entered in GestiCasa is accessible only by the managing owner of each account and the tenants linked to their respective contracts. Personal information is not shared with unauthorised third parties.'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '6. Proveedores tecnológicos' : '6. Technology providers'}</h4>
              <p className="mb-3 text-xs">{isEs ? 'GestiCasa utiliza Supabase como plataforma de autenticación, base de datos y almacenamiento de archivos. Supabase actúa como encargado del tratamiento conforme al RGPD. Para más información, consulte la política de privacidad de Supabase en supabase.com.' : 'GestiCasa uses Supabase as its authentication, database and file storage platform. Supabase acts as data processor under the GDPR. For more information, see the Supabase privacy policy at supabase.com.'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '7. Transferencias internacionales' : '7. International transfers'}</h4>
              <p className="mb-3 text-xs">{isEs ? 'Los datos pueden ser almacenados en servidores ubicados fuera del Espacio Económico Europeo en función de la configuración de Supabase. En tal caso, se aplican las garantías adecuadas conforme al RGPD.' : 'Data may be stored on servers located outside the European Economic Area depending on Supabase configuration. In such cases, appropriate safeguards under the GDPR apply.'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '8. Plazos de conservación' : '8. Retention periods'}</h4>
              <p className="mb-3 text-xs">{isEs ? 'Los datos se conservan mientras la cuenta esté activa. Una vez eliminada la cuenta o el contrato, los datos se mantendrán durante el plazo legalmente exigible para atender posibles reclamaciones y obligaciones fiscales, y posteriormente serán suprimidos o anonimizados.' : 'Data is retained for as long as the account is active. Once the account or contract is deleted, data will be kept for the legally required period to handle possible claims and tax obligations, and then deleted or anonymised.'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '9. Sus derechos' : '9. Your rights'}</h4>
              <p className="mb-2 text-xs">{isEs ? 'Conforme al RGPD y la LOPDGDD, usted tiene derecho a:' : 'Under the GDPR and applicable law, you have the right to:'}</p>
              <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                <li>{isEs ? 'Acceder a sus datos personales.' : 'Access your personal data.'}</li>
                <li>{isEs ? 'Rectificar datos inexactos o incompletos.' : 'Rectify inaccurate or incomplete data.'}</li>
                <li>{isEs ? 'Solicitar la supresión de sus datos cuando ya no sean necesarios.' : 'Request erasure of your data when it is no longer necessary.'}</li>
                <li>{isEs ? 'Oponerse al tratamiento o solicitar su limitación.' : 'Object to processing or request its restriction.'}</li>
                <li>{isEs ? 'Solicitar la portabilidad de sus datos.' : 'Request data portability.'}</li>
                <li>{isEs ? 'Retirar el consentimiento en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.' : 'Withdraw consent at any time without affecting the lawfulness of prior processing.'}</li>
              </ul>
              <p className="mb-3 text-xs">{isEs ? 'Para ejercer sus derechos, contacte a través de la sección de Ayuda y Soporte.' : 'To exercise your rights, contact us via the Help & Support section.'}</p>
              <p className="mb-3 text-xs">{isEs ? 'También tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) en www.aepd.es.' : 'You also have the right to lodge a complaint with the Spanish Data Protection Agency (AEPD) at www.aepd.es.'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '10. Seguridad' : '10. Security'}</h4>
              <p className="mb-3 text-xs">{isEs ? 'GestiCasa aplica medidas técnicas y organizativas adecuadas para proteger sus datos frente a accesos no autorizados, pérdida o destrucción. La autenticación y el almacenamiento de datos se realizan a través de Supabase, que implementa cifrado en tránsito y en reposo.' : 'GestiCasa applies appropriate technical and organisational measures to protect your data against unauthorised access, loss or destruction. Authentication and data storage are handled via Supabase, which implements encryption in transit and at rest.'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '11. Documentos subidos por usuarios' : '11. User-uploaded documents'}</h4>
              <p className="mb-3 text-xs">{isEs ? 'Los archivos subidos a GestiCasa (contratos, DNI, justificantes, etc.) se almacenan en Supabase Storage con acceso restringido. Solo el propietario y el inquilino vinculado pueden acceder a dichos documentos.' : 'Files uploaded to GestiCasa (contracts, ID documents, receipts, etc.) are stored in Supabase Storage with restricted access. Only the linked owner and tenant can access these documents.'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '12. Cookies y tecnologías similares' : '12. Cookies and similar technologies'}</h4>
              <p className="mb-3 text-xs">{isEs ? 'GestiCasa es una aplicación web progresiva (PWA) que puede utilizar almacenamiento local del navegador (localStorage) para guardar preferencias de usuario como idioma y tema. No utiliza cookies de terceros con fines publicitarios.' : 'GestiCasa is a progressive web application (PWA) that may use browser local storage (localStorage) to save user preferences such as language and theme. It does not use third-party advertising cookies.'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '13. Actualización de esta política' : '13. Policy updates'}</h4>
              <p className="mb-6 text-xs">{isEs ? 'Esta política puede actualizarse para reflejar cambios en la aplicación o en la normativa vigente. La versión actualizada estará siempre disponible en esta sección.' : 'This policy may be updated to reflect changes in the application or applicable regulations. The updated version will always be available in this section.'}</p>
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
              {isTenant ? (
                <>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{isEs ? 'Manual del Inquilino — GestiCasa' : 'Tenant Guide — GestiCasa'}</h3>
                  <p className="text-xs text-slate-400 mb-4">{isEs ? 'Guía completa para el portal del inquilino.' : 'Complete guide to the tenant portal.'}</p>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '1. Registro e inicio de sesión' : '1. Registration & Sign In'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Tu cuenta de inquilino es creada e invitada por tu propietario. Recibirás un correo de activación.' : 'Your tenant account is created and invited by your landlord. You will receive an activation email.'}</li>
                    <li>{isEs ? 'Accede con tu correo electrónico y la contraseña que hayas establecido.' : 'Sign in with your email and the password you have set.'}</li>
                    <li>{isEs ? 'Si tienes problemas de acceso, contacta con tu propietario o usa la sección de Ayuda y Soporte.' : 'If you have access issues, contact your landlord or use the Help & Support section.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '2. Pantalla de inicio — Mi alquiler' : '2. Home Screen — My Rental'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Al entrar verás los datos de tu inmueble: dirección y nombre de la propiedad vinculada a tu contrato.' : 'On entry you will see your property details: address and name of the property linked to your contract.'}</li>
                    <li>{isEs ? 'Consulta la renta mensual, el importe de la fianza y las fechas de inicio y fin de contrato.' : 'Check the monthly rent, deposit amount and contract start and end dates.'}</li>
                    <li>{isEs ? 'El indicador de "Estado del pago" te informa si estás al día, tienes un pago pendiente o acumulas deuda según los registros del propietario.' : 'The "Payment status" indicator tells you whether you are up to date, have a pending payment or accumulated debt according to the owner\'s records.'}</li>
                    <li>{isEs ? 'Si no ves ningún contrato, contacta con tu propietario para que lo vincule a tu cuenta.' : 'If you see no contract, contact your landlord to link it to your account.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '3. Documentos' : '3. Documents'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Accede a la pestaña "Documentos" para consultar todos los archivos disponibles: contrato de alquiler y cualquier otro documento compartido por el propietario.' : 'Go to the "Documents" tab to view all available files: your rental contract and any other document shared by the landlord.'}</li>
                    <li>{isEs ? 'Puedes visualizar los documentos directamente desde la app o descargarlos a tu dispositivo.' : 'You can view documents directly in the app or download them to your device.'}</li>
                    <li>{isEs ? 'También puedes subir tus propios documentos pulsando el botón "Subir": DNI, nóminas, seguros u otros justificantes.' : 'You can also upload your own documents using the "Upload" button: ID, payslips, insurance or other supporting documents.'}</li>
                    <li>{isEs ? 'Selecciona el tipo de documento antes de subirlo para que quede correctamente clasificado.' : 'Select the document type before uploading so it is correctly categorised.'}</li>
                    <li>{isEs ? 'Los documentos que hayas subido tú mismo pueden eliminarse pulsando el icono de papelera.' : 'Documents you have uploaded yourself can be deleted by pressing the trash icon.'}</li>
                    <li>{isEs ? 'Los documentos compartidos por el propietario son de solo lectura para el inquilino.' : 'Documents shared by the landlord are read-only for the tenant.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '4. Incidencias' : '4. Issues'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Usa la pestaña "Incidencias" para comunicar cualquier avería, problema o necesidad relacionada con el inmueble.' : 'Use the "Issues" tab to report any breakdown, problem or need related to the property.'}</li>
                    <li>{isEs ? 'Pulsa "Nueva" e introduce un asunto y una descripción detallada del problema.' : 'Tap "New" and enter a subject and detailed description of the problem.'}</li>
                    <li>{isEs ? 'Una vez creada, la incidencia queda registrada con estado "Abierta".' : 'Once created, the issue is recorded with status "Open".'}</li>
                    <li>{isEs ? 'El propietario puede cambiar el estado a "En progreso" o "Resuelta".' : 'The landlord can change the status to "In progress" or "Resolved".'}</li>
                    <li>{isEs ? 'Pulsa sobre cualquier incidencia para ver su historial completo y añadir mensajes de seguimiento.' : 'Tap any issue to see its full history and add follow-up messages.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '5. Chat con el propietario' : '5. Chat with Landlord'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'La pestaña "Chat" te permite comunicarte directamente con tu propietario para cualquier asunto general.' : 'The "Chat" tab lets you communicate directly with your landlord for any general matter.'}</li>
                    <li>{isEs ? 'Los mensajes son privados y solo visibles entre tú y tu propietario.' : 'Messages are private and only visible between you and your landlord.'}</li>
                    <li>{isEs ? 'El indicador rojo sobre el icono del chat te avisa cuando tienes mensajes nuevos no leídos.' : 'The red indicator on the chat icon alerts you when you have new unread messages.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '6. Seguro de Hogar' : '6. Home Insurance'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Desde Configuración → "Servicios para ti" puedes solicitar información sobre un seguro de hogar adaptado a tu situación como inquilino.' : 'From Settings → "Services for You" you can request information on home insurance tailored to your situation as a tenant.'}</li>
                    <li>{isEs ? 'Rellena los datos del formulario (dirección, tipo de vivienda, información adicional) y envía la solicitud.' : 'Fill in the form fields (address, property type, additional information) and submit the request.'}</li>
                    <li>{isEs ? 'El equipo de GestiCasa se pondrá en contacto contigo a través del correo registrado.' : 'The GestiCasa team will contact you via your registered email.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '7. Perfil y configuración' : '7. Profile & Settings'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Pulsa el icono de usuario en la esquina superior derecha para abrir la Configuración.' : 'Tap the user icon in the top right corner to open Settings.'}</li>
                    <li>{isEs ? 'Puedes cambiar el idioma (Español / English) y el tema (Claro / Oscuro).' : 'You can change the language (Spanish / English) and theme (Light / Dark).'}</li>
                    <li>{isEs ? 'Desde esta sección también puedes acceder al Manual, la Ayuda y Soporte, y la Política de Privacidad.' : 'From this section you can also access the Manual, Help & Support, and Privacy Policy.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '8. Ayuda y Soporte' : '8. Help & Support'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Si tienes algún problema técnico o duda sobre el funcionamiento de la app, ve a Configuración → "Ayuda y Soporte".' : 'If you have a technical issue or question about how the app works, go to Settings → "Help & Support".'}</li>
                    <li>{isEs ? 'Escribe tu consulta y envíala. El equipo de GestiCasa te responderá por correo electrónico.' : 'Write your query and send it. The GestiCasa team will reply by email.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '9. Cierre de sesión' : '9. Sign Out'}</h4>
                  <ul className="list-disc pl-5 mb-6 space-y-1 text-xs">
                    <li>{isEs ? 'Ve a Configuración y pulsa "Cerrar Sesión" en la parte inferior para salir de la aplicación de forma segura.' : 'Go to Settings and tap "Sign Out" at the bottom to exit the application safely.'}</li>
                  </ul>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{isEs ? 'Manual del Propietario — GestiCasa' : 'Owner Manual — GestiCasa'}</h3>
                  <p className="text-xs text-slate-400 mb-4">{isEs ? 'Guía completa para la gestión de tu patrimonio inmobiliario.' : 'Complete guide to managing your real estate portfolio.'}</p>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '1. Registro e inicio de sesión' : '1. Registration & Sign In'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Regístrate con tu correo electrónico y contraseña. Recibirás un correo de confirmación.' : 'Register with your email and password. You will receive a confirmation email.'}</li>
                    <li>{isEs ? 'Una vez confirmada la cuenta, inicia sesión. La aplicación detectará automáticamente tu perfil de propietario.' : 'Once your account is confirmed, sign in. The app will automatically detect your owner profile.'}</li>
                    <li>{isEs ? 'Si olvidaste tu contraseña, usa la opción de recuperación en la pantalla de acceso.' : 'If you forgot your password, use the recovery option on the login screen.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '2. Dashboard — Panel de control' : '2. Dashboard'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'El Dashboard es tu pantalla principal. Muestra un resumen del estado de tu patrimonio: ingresos y gastos del mes actual, ocupación, alertas y gráfico anual.' : 'The Dashboard is your main screen. It shows a summary of your portfolio status: current month income and expenses, occupancy, alerts and annual chart.'}</li>
                    <li>{isEs ? 'Las tarjetas superiores muestran los ingresos del mes, gastos del mes y beneficio neto.' : 'The top cards show monthly income, monthly expenses and net profit.'}</li>
                    <li>{isEs ? 'Las alertas te avisan de pagos en deuda, contratos próximos a vencer e incidencias abiertas.' : 'Alerts notify you of payments in debt, contracts near expiry and open issues.'}</li>
                    <li>{isEs ? 'El gráfico de barras muestra ingresos y gastos mensuales del año seleccionado.' : 'The bar chart shows monthly income and expenses for the selected year.'}</li>
                    <li>{isEs ? 'Pulsa sobre una alerta para ir directamente a la sección correspondiente.' : 'Tap an alert to go directly to the relevant section.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '3. Portfolio — Gestión de inmuebles' : '3. Portfolio — Property Management'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Accede a la sección "Portfolio" desde la barra de navegación inferior.' : 'Access the "Portfolio" section from the bottom navigation bar.'}</li>
                    <li>{isEs ? 'Aquí puedes ver todos tus inmuebles filtrados por estado: Todos, Alquilado, Vacío, En reforma.' : 'Here you can see all your properties filtered by status: All, Rented, Vacant, Under renovation.'}</li>
                    <li>{isEs ? 'Pulsa "+ Añadir inmueble" para crear uno nuevo. Introduce: nombre, dirección, tipo, estado, precio de compra, renta de mercado e hipoteca mensual.' : 'Tap "+ Add property" to create a new one. Enter: name, address, type, status, purchase price, market rent and monthly mortgage.'}</li>
                    <li>{isEs ? 'Pulsa sobre cualquier inmueble para ver su ficha completa y editarla.' : 'Tap any property to view its full profile and edit it.'}</li>
                    <li>{isEs ? 'Desde la ficha del inmueble puedes ver los contratos, transacciones e incidencias vinculadas.' : 'From the property profile you can see linked contracts, transactions and issues.'}</li>
                    <li>{isEs ? 'Los inmuebles pueden eliminarse si no tienen contratos activos vinculados.' : 'Properties can be deleted if they have no active linked contracts.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '4. Inquilinos — Gestión de inquilinos' : '4. Tenants — Tenant Management'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Accede a "Inquilinos" desde la barra de navegación.' : 'Access "Tenants" from the navigation bar.'}</li>
                    <li>{isEs ? 'Aquí puedes crear fichas de inquilinos con: nombre completo, DNI/NIE, teléfono, correo electrónico y notas.' : 'Here you can create tenant profiles with: full name, ID number, phone, email and notes.'}</li>
                    <li>{isEs ? 'Desde la ficha del inquilino puedes ver sus contratos activos, el estado de pago y los documentos.' : 'From the tenant profile you can see their active contracts, payment status and documents.'}</li>
                    <li>{isEs ? 'Para invitar a un inquilino al portal de inquilinos, genera un enlace de invitación desde su ficha y compártelo.' : 'To invite a tenant to the tenant portal, generate an invitation link from their profile and share it.'}</li>
                    <li>{isEs ? 'Una vez vinculado, el inquilino podrá acceder a su portal con sus propias credenciales.' : 'Once linked, the tenant can access their portal with their own credentials.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '5. Contratos' : '5. Contracts'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Los contratos se crean desde la ficha del inmueble o del inquilino.' : 'Contracts are created from the property or tenant profile.'}</li>
                    <li>{isEs ? 'Introduce: inmueble, inquilino(s), fecha de inicio, fecha de fin, importe de renta mensual, fianza y cláusulas adicionales.' : 'Enter: property, tenant(s), start date, end date, monthly rent amount, deposit and additional clauses.'}</li>
                    <li>{isEs ? 'El estado del contrato puede ser: Activo, Finalizado o Cancelado.' : 'Contract status can be: Active, Completed or Cancelled.'}</li>
                    <li>{isEs ? 'Puedes adjuntar el documento PDF del contrato para que el inquilino pueda descargarlo desde su portal.' : 'You can attach the contract PDF so the tenant can download it from their portal.'}</li>
                    <li>{isEs ? 'El seguimiento del pago de rentas se realiza desde la ficha del contrato.' : 'Rent payment tracking is done from the contract profile.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '6. Pagos y transacciones' : '6. Payments & Transactions'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Registra ingresos (rentas cobradas) y gastos (reparaciones, seguros, IBI, etc.) vinculados a cada inmueble.' : 'Record income (collected rents) and expenses (repairs, insurance, IBI, etc.) linked to each property.'}</li>
                    <li>{isEs ? 'Cada transacción incluye: fecha, importe, tipo (ingreso o gasto), categoría y descripción.' : 'Each transaction includes: date, amount, type (income or expense), category and description.'}</li>
                    <li>{isEs ? 'El estado de pago del contrato (Al día / Pendiente / Deuda) se calcula automáticamente en función de las transacciones registradas.' : 'The contract payment status (Up to date / Pending / Debt) is calculated automatically based on registered transactions.'}</li>
                    <li>{isEs ? 'El Dashboard y el gráfico anual reflejan automáticamente todos los ingresos y gastos registrados.' : 'The Dashboard and annual chart automatically reflect all recorded income and expenses.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '7. Documentos' : '7. Documents'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Puedes subir y gestionar documentos vinculados a cada contrato: contratos firmados, recibos, certificados energéticos, etc.' : 'You can upload and manage documents linked to each contract: signed contracts, receipts, energy certificates, etc.'}</li>
                    <li>{isEs ? 'Marca un documento como "Compartido" para que el inquilino pueda verlo desde su portal.' : 'Mark a document as "Shared" so the tenant can view it from their portal.'}</li>
                    <li>{isEs ? 'El inquilino también puede subir sus propios documentos (DNI, nóminas, etc.), que verás reflejados en la ficha del contrato.' : 'The tenant can also upload their own documents (ID, payslips, etc.), which you will see in the contract profile.'}</li>
                    <li>{isEs ? 'Los documentos se almacenan de forma segura y solo son accesibles por las partes autorizadas.' : 'Documents are stored securely and only accessible by authorised parties.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '8. Incidencias' : '8. Issues'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Las incidencias son comunicadas por el inquilino desde su portal o por el propietario directamente.' : 'Issues are reported by the tenant from their portal or by the owner directly.'}</li>
                    <li>{isEs ? 'Cada incidencia tiene un título, descripción, fecha y estado (Abierta, En progreso, Resuelta).' : 'Each issue has a title, description, date and status (Open, In progress, Resolved).'}</li>
                    <li>{isEs ? 'Puedes actualizar el estado de las incidencias y añadir mensajes de seguimiento para comunicarte con el inquilino.' : 'You can update issue status and add follow-up messages to communicate with the tenant.'}</li>
                    <li>{isEs ? 'Las incidencias abiertas aparecen como alertas en el Dashboard.' : 'Open issues appear as alerts on the Dashboard.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '9. Calculadora' : '9. Calculator'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'La sección "Calculadora" te permite realizar cálculos de rentabilidad: rendimiento bruto, neto y ROI de cada inmueble.' : 'The "Calculator" section lets you perform profitability calculations: gross yield, net yield and ROI for each property.'}</li>
                    <li>{isEs ? 'Introduce el precio de compra, renta mensual y gastos para obtener los indicadores de rentabilidad.' : 'Enter the purchase price, monthly rent and expenses to get profitability indicators.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '10. Servicios para propietarios' : '10. Services for Owners'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Desde Configuración → "Servicios para ti" puedes solicitar: Hipotecas, Seguro de Impago, Consulta de Morosidad y Seguros.' : 'From Settings → "Services for You" you can request: Mortgages, Non-Payment Insurance, Default Check and Insurance.'}</li>
                    <li>{isEs ? 'Hipotecas: solicita asesoramiento para compra de vivienda, mejora de condiciones o ampliación.' : 'Mortgages: request advice for home purchase, better terms or extension.'}</li>
                    <li>{isEs ? 'Seguro de Impago: protege tus rentas ante posibles impagos del inquilino.' : 'Non-Payment Insurance: protect your rents against possible tenant defaults.'}</li>
                    <li>{isEs ? 'Consulta de Morosidad: verifica la solvencia de un inquilino antes de firmar un contrato.' : 'Default Check: verify a tenant\'s creditworthiness before signing a contract.'}</li>
                    <li>{isEs ? 'Seguros: información sobre seguros del hogar, de comunidad o de responsabilidad civil.' : 'Insurance: information on home, community or liability insurance.'}</li>
                    <li>{isEs ? 'Rellena el formulario de cada servicio y el equipo de GestiCasa te contactará por correo.' : 'Fill in each service form and the GestiCasa team will contact you by email.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '11. Exportar datos' : '11. Export Data'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Desde Configuración → "Extraer datos" puedes exportar un informe anual de ingresos y gastos en formato PDF.' : 'From Settings → "Extract data" you can export an annual income and expense report in PDF format.'}</li>
                    <li>{isEs ? 'El informe incluye el resumen anual de todas las transacciones de tu portfolio.' : 'The report includes the annual summary of all transactions in your portfolio.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '12. Configuración' : '12. Settings'}</h4>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-xs">
                    <li>{isEs ? 'Pulsa el icono de usuario en el Dashboard para abrir la Configuración.' : 'Tap the user icon on the Dashboard to open Settings.'}</li>
                    <li>{isEs ? 'Puedes editar tu nombre, cambiar el idioma (Español / English) y activar el modo oscuro.' : 'You can edit your name, change the language (Spanish / English) and enable dark mode.'}</li>
                    <li>{isEs ? 'En la parte inferior encontrarás el botón "Cerrar Sesión" para salir de forma segura.' : 'At the bottom you will find the "Sign Out" button to exit safely.'}</li>
                  </ul>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-5 mb-1">{isEs ? '13. Ayuda y Soporte' : '13. Help & Support'}</h4>
                  <ul className="list-disc pl-5 mb-6 space-y-1 text-xs">
                    <li>{isEs ? 'Si tienes dudas o problemas técnicos, ve a Configuración → "Ayuda y Soporte" y envía un mensaje.' : 'If you have questions or technical issues, go to Settings → "Help & Support" and send a message.'}</li>
                    <li>{isEs ? 'El equipo de GestiCasa te responderá por correo electrónico en la dirección registrada.' : 'The GestiCasa team will reply by email to your registered address.'}</li>
                  </ul>
                </>
              )}
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
