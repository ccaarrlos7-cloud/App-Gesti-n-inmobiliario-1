import { formatNumber } from "../utils";
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Moon, Globe, Bell, Download, Book, Mail, Shield, ChevronRight, ChevronLeft, User, X, Check, FileText, Table, Send, Sun, LogOut } from 'lucide-react';
import { useAppContext } from '../store';
import { supabase } from '../lib/supabase';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { properties, tenants, userName, setUserName, avatarUrl, setAvatarUrl, theme, setTheme, language, setLanguage } = useAppContext();
  
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

  const handleSendSupport = async () => {
    setIsSendingSupport(true);
    setSupportError('');
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          message: supportMessage
        })
      });
      if (response.ok) {
        setSupportSent(true);
      } else {
        const errorData = await response.json();
        setSupportError(errorData.error || (isEs ? 'Hubo un error al enviar tu consulta.' : 'There was an error sending your inquiry.'));
      }
    } catch (err) {
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
           <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white dark:bg-slate-900">
             <button onClick={() => setShowPrivacy(false)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
               <ChevronLeft size={24} />
             </button>
             <h2 className="font-bold text-[16px] text-slate-900 dark:text-white ml-2">{isEs ? 'Política de Privacidad' : 'Privacy Policy'}</h2>
           </div>
           <div className="p-6 overflow-y-auto prose prose-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{isEs ? 'POLÍTICA DE PRIVACIDAD DE GESTINMO' : 'GESTINMO PRIVACY POLICY'}</h3>
              <p className="mb-4"><strong>{isEs ? 'Última actualización: 1 de septiembre de 2026' : 'Last updated: September 1, 2026'}</strong></p>
              <p className="mb-6">{isEs ? 'En GestInmo nos comprometemos a proteger la privacidad y la seguridad de los datos personales de nuestros usuarios. Esta Política de Privacidad explica qué información podemos recopilar, para qué la utilizamos, cómo la protegemos y cuáles son los derechos de los usuarios.' : 'At GestInmo, we are committed to protecting the privacy and security of our users\' personal data. This Privacy Policy explains what information we may collect, what we use it for, how we protect it, and what users\' rights are.'}</p>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '1. Responsable del tratamiento' : '1. Data Controller'}</h4>
              <p className="mb-6">{isEs ? 'Responsable del tratamiento: GestInmo' : 'Data Controller: GestInmo'}<br/>
              {isEs ? 'Correo electrónico: ' : 'Email: '}<a href="mailto:Appgestioninmuebles@gmail.com" className="text-blue-600 hover:underline">Appgestioninmuebles@gmail.com</a></p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '2. Información que recopilamos' : '2. Information we collect'}</h4>
              <p className="mb-2">{isEs ? 'Dependiendo del uso que haga el usuario de la aplicación, GestInmo puede tratar diferentes categorías de información:' : 'Depending on the user\'s use of the application, GestInmo may process different categories of information:'}</p>
              
              <p className="font-semibold mt-4 mb-1">{isEs ? 'Datos de la cuenta' : 'Account data'}</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Dirección de correo electrónico.' : 'Email address.'}</li>
                <li>{isEs ? 'Nombre o nombre de perfil.' : 'Name or profile name.'}</li>
                <li>{isEs ? 'Identificador único asociado a la cuenta de usuario.' : 'Unique identifier associated with the user account.'}</li>
                <li>{isEs ? 'Información necesaria para gestionar el acceso y autenticación en la aplicación.' : 'Information necessary to manage access and authentication in the application.'}</li>
              </ul>

              <p className="font-semibold mt-4 mb-1">{isEs ? 'Datos de inmuebles' : 'Property data'}</p>
              <p className="mb-2">{isEs ? 'El usuario puede introducir información relacionada con sus inmuebles, incluyendo, entre otros:' : 'The user may enter information related to their properties, including, but not limited to:'}</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Dirección o ubicación del inmueble.' : 'Address or location of the property.'}</li>
                <li>{isEs ? 'Tipo de inmueble.' : 'Property type.'}</li>
                <li>{isEs ? 'Superficie.' : 'Surface area.'}</li>
                <li>{isEs ? 'Precio de compra.' : 'Purchase price.'}</li>
                <li>{isEs ? 'Valor de mercado.' : 'Market value.'}</li>
                <li>{isEs ? 'Precio de alquiler.' : 'Rental price.'}</li>
                <li>{isEs ? 'Gastos asociados.' : 'Associated expenses.'}</li>
                <li>{isEs ? 'Información hipotecaria.' : 'Mortgage information.'}</li>
                <li>{isEs ? 'Información sobre reformas.' : 'Information on renovations.'}</li>
                <li>{isEs ? 'Información de mantenimiento.' : 'Maintenance information.'}</li>
                <li>{isEs ? 'Incidencias, gastos y otros datos relacionados con la gestión del inmueble.' : 'Incidents, expenses, and other data related to property management.'}</li>
              </ul>

              <p className="font-semibold mt-4 mb-1">{isEs ? 'Datos de inquilinos y contratos' : 'Tenant and contract data'}</p>
              <p className="mb-2">{isEs ? 'Cuando el usuario utiliza las funciones de gestión de alquileres, puede introducir información relativa a:' : 'When the user uses the rental management functions, they may enter information regarding:'}</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Inquilinos.' : 'Tenants.'}</li>
                <li>{isEs ? 'Contratos de alquiler.' : 'Lease contracts.'}</li>
                <li>{isEs ? 'Fechas de inicio y finalización.' : 'Start and end dates.'}</li>
                <li>{isEs ? 'Importes de alquiler.' : 'Rental amounts.'}</li>
                <li>{isEs ? 'Fianzas.' : 'Deposits.'}</li>
                <li>{isEs ? 'Estado de los pagos.' : 'Payment status.'}</li>
                <li>{isEs ? 'Información relacionada con la gestión de los contratos.' : 'Information related to contract management.'}</li>
              </ul>
              <p className="mb-4">{isEs ? 'El usuario será responsable de asegurarse de que dispone de una base legal adecuada para introducir y gestionar datos personales de terceros en la aplicación.' : 'The user will be responsible for ensuring they have a suitable legal basis for entering and managing third-party personal data in the application.'}</p>

              <p className="font-semibold mt-4 mb-1">{isEs ? 'Documentos y archivos' : 'Documents and files'}</p>
              <p className="mb-2">{isEs ? 'La aplicación puede permitir al usuario almacenar documentos relacionados con sus inmuebles, contratos u otra información de gestión.' : 'The application may allow the user to store documents related to their properties, contracts, or other management information.'}</p>
              <p className="mb-6">{isEs ? 'El usuario debe evitar almacenar información que no sea necesaria para la finalidad de gestión de sus inmuebles y debe actuar conforme a la normativa aplicable en materia de protección de datos.' : 'The user should avoid storing information that is not necessary for the purpose of managing their properties and must act in accordance with applicable data protection regulations.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '3. Finalidad del tratamiento' : '3. Purpose of processing'}</h4>
              <p className="mb-2">{isEs ? 'Los datos se utilizan principalmente para proporcionar y mejorar las funcionalidades de GestInmo, incluyendo:' : 'Data is mainly used to provide and improve GestInmo functionalities, including:'}</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Crear y gestionar la cuenta del usuario.' : 'Create and manage the user account.'}</li>
                <li>{isEs ? 'Permitir el inicio y cierre de sesión.' : 'Allow login and logout.'}</li>
                <li>{isEs ? 'Mantener la sesión iniciada de forma segura.' : 'Keep the session securely logged in.'}</li>
                <li>{isEs ? 'Gestionar inmuebles y propiedades.' : 'Manage real estate and properties.'}</li>
                <li>{isEs ? 'Gestionar inquilinos y contratos.' : 'Manage tenants and contracts.'}</li>
                <li>{isEs ? 'Registrar y consultar pagos de alquiler.' : 'Record and query rental payments.'}</li>
                <li>{isEs ? 'Gestionar gastos, ingresos e incidencias.' : 'Manage expenses, income, and incidents.'}</li>
                <li>{isEs ? 'Permitir el almacenamiento y consulta de documentos cuando esta funcionalidad esté disponible.' : 'Allow the storage and querying of documents when this functionality is available.'}</li>
                <li>{isEs ? 'Generar cálculos, estadísticas, informes y otros datos derivados de la información introducida por el usuario.' : 'Generate calculations, statistics, reports, and other data derived from the information entered by the user.'}</li>
                <li>{isEs ? 'Mantener la seguridad de la aplicación.' : 'Maintain application security.'}</li>
                <li>{isEs ? 'Detectar y solucionar errores técnicos.' : 'Detect and fix technical errors.'}</li>
                <li>{isEs ? 'Mejorar el funcionamiento y la experiencia de usuario.' : 'Improve functioning and user experience.'}</li>
              </ul>
              <p className="mb-6">{isEs ? 'GestInmo no utilizará los datos introducidos por el usuario para fines incompatibles con las finalidades descritas en esta política.' : 'GestInmo will not use the data entered by the user for purposes incompatible with those described in this policy.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '4. Base jurídica' : '4. Legal basis'}</h4>
              <p className="mb-2">{isEs ? 'El tratamiento de los datos personales se realizará, según corresponda, sobre las siguientes bases jurídicas:' : 'The processing of personal data will be carried out, as appropriate, on the following legal bases:'}</p>
              <ul className="list-disc pl-5 mb-6 space-y-1">
                <li>{isEs ? 'Ejecución de la relación con el usuario: cuando el tratamiento sea necesario para proporcionar las funcionalidades solicitadas de GestInmo.' : 'Execution of the relationship with the user: when the processing is necessary to provide the requested GestInmo functionalities.'}</li>
                <li>{isEs ? 'Consentimiento: cuando sea necesario obtenerlo conforme a la legislación aplicable.' : 'Consent: when necessary to obtain it according to applicable legislation.'}</li>
                <li>{isEs ? 'Interés legítimo: para garantizar la seguridad, prevenir usos fraudulentos, mantener y mejorar la aplicación y resolver problemas técnicos, siempre respetando los derechos y libertades de los usuarios.' : 'Legitimate interest: to guarantee security, prevent fraudulent use, maintain and improve the application and solve technical problems, always respecting the rights and freedoms of users.'}</li>
                <li>{isEs ? 'Cumplimiento de obligaciones legales: cuando el tratamiento resulte necesario para cumplir obligaciones establecidas por la normativa aplicable.' : 'Compliance with legal obligations: when processing is necessary to comply with obligations established by applicable regulations.'}</li>
              </ul>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '5. Datos de terceros introducidos por el usuario' : '5. Third-party data entered by the user'}</h4>
              <p className="mb-2">{isEs ? 'GestInmo permite gestionar información relacionada con terceras personas, especialmente inquilinos.' : 'GestInmo allows the management of information related to third parties, especially tenants.'}</p>
              <p className="mb-2">{isEs ? 'El usuario que introduzca datos personales de terceros será responsable de garantizar que tiene legitimación suficiente para hacerlo y de cumplir las obligaciones que le correspondan conforme a la normativa de protección de datos.' : 'The user entering third-party personal data will be responsible for ensuring they have sufficient legitimacy to do so and for fulfilling their corresponding obligations according to data protection regulations.'}</p>
              <p className="mb-6">{isEs ? 'GestInmo tratará dichos datos únicamente en la medida necesaria para proporcionar las funcionalidades de gestión solicitadas por el usuario.' : 'GestInmo will process such data only to the extent necessary to provide the management functionalities requested by the user.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '6. Seguridad de la información' : '6. Information security'}</h4>
              <p className="mb-2">{isEs ? 'GestInmo aplica medidas técnicas y organizativas destinadas a proteger la información almacenada frente a accesos no autorizados, pérdida, alteración, divulgación o destrucción.' : 'GestInmo applies technical and organizational measures aimed at protecting stored information against unauthorized access, loss, alteration, disclosure, or destruction.'}</p>
              <p className="mb-2">{isEs ? 'La aplicación utiliza mecanismos de autenticación y control de acceso para limitar el acceso a la información de cada cuenta.' : 'The application uses authentication and access control mechanisms to limit access to each account\'s information.'}</p>
              <p className="mb-2">{isEs ? 'Asimismo, se aplican mecanismos de seguridad a nivel de base de datos destinados a evitar que un usuario pueda acceder a los datos pertenecientes a otros usuarios.' : 'Likewise, database-level security mechanisms are applied to prevent a user from accessing data belonging to other users.'}</p>
              <p className="mb-6">{isEs ? 'No obstante, ningún sistema conectado a Internet puede garantizar una seguridad absoluta. Por este motivo, GestInmo continuará revisando y mejorando sus medidas de seguridad.' : 'However, no system connected to the Internet can guarantee absolute security. For this reason, GestInmo will continue reviewing and improving its security measures.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '7. Separación de datos entre usuarios' : '7. Data separation among users'}</h4>
              <p className="mb-2">{isEs ? 'Los datos introducidos en GestInmo están asociados a la cuenta del usuario correspondiente.' : 'The data entered in GestInmo is associated with the corresponding user account.'}</p>
              <p className="mb-2">{isEs ? 'GestInmo utiliza mecanismos de control de acceso para garantizar que cada usuario pueda acceder únicamente a la información asociada a su propia cuenta.' : 'GestInmo uses access control mechanisms to ensure each user can access only the information associated with their own account.'}</p>
              <p className="mb-6">{isEs ? 'El usuario no debe compartir sus credenciales de acceso con terceros.' : 'The user should not share their access credentials with third parties.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '8. Conservación de los datos' : '8. Data retention'}</h4>
              <p className="mb-2">{isEs ? 'Los datos se conservarán mientras la cuenta del usuario permanezca activa y mientras resulte necesario para proporcionar las funcionalidades de GestInmo.' : 'The data will be retained as long as the user account remains active and as long as it is necessary to provide GestInmo functionalities.'}</p>
              <p className="mb-2">{isEs ? 'Cuando el usuario solicite la eliminación de su cuenta, se procederá a eliminar o anonimizar los datos personales asociados a ella cuando corresponda, salvo que exista una obligación legal que requiera su conservación durante un periodo determinado.' : 'When the user requests account deletion, the personal data associated with it will be deleted or anonymized when appropriate, unless there is a legal obligation requiring its retention for a specific period.'}</p>
              <p className="mb-6">{isEs ? 'Los datos podrán conservarse durante el tiempo necesario para atender posibles responsabilidades legales o cumplir obligaciones legales.' : 'The data may be retained for the time necessary to address possible legal liabilities or fulfill legal obligations.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '9. Proveedores de servicios' : '9. Service providers'}</h4>
              <p className="mb-2">{isEs ? 'GestInmo puede utilizar proveedores tecnológicos externos necesarios para proporcionar determinadas funcionalidades de la aplicación, como servicios de autenticación, almacenamiento, bases de datos, infraestructura tecnológica o servicios relacionados.' : 'GestInmo may use external technological providers necessary to provide certain application functionalities, such as authentication, storage, database, technological infrastructure, or related services.'}</p>
              <p className="mb-6">{isEs ? 'Estos proveedores únicamente deberán acceder a la información en la medida necesaria para prestar los servicios correspondientes y estarán sujetos a las obligaciones de protección de datos que resulten aplicables.' : 'These providers shall only access the information to the extent necessary to provide the corresponding services and will be subject to applicable data protection obligations.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '10. Transferencias internacionales' : '10. International transfers'}</h4>
              <p className="mb-2">{isEs ? 'En función de los proveedores tecnológicos utilizados por GestInmo y de la ubicación de sus servidores, determinados datos podrían ser tratados fuera del Espacio Económico Europeo.' : 'Depending on the technological providers used by GestInmo and the location of their servers, certain data could be processed outside the European Economic Area.'}</p>
              <p className="mb-6">{isEs ? 'Cuando se produzcan transferencias internacionales de datos, se adoptarán las garantías y mecanismos exigidos por la normativa aplicable, cuando sean necesarios.' : 'When international data transfers occur, the guarantees and mechanisms required by applicable regulations will be adopted when necessary.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '11. Derechos de los usuarios' : '11. User rights'}</h4>
              <p className="mb-2">{isEs ? 'El usuario puede ejercer los derechos reconocidos por la normativa aplicable en materia de protección de datos, incluyendo:' : 'The user may exercise the rights recognized by applicable data protection regulations, including:'}</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Derecho de acceso.' : 'Right of access.'}</li>
                <li>{isEs ? 'Derecho de rectificación.' : 'Right to rectification.'}</li>
                <li>{isEs ? 'Derecho de supresión.' : 'Right to erasure.'}</li>
                <li>{isEs ? 'Derecho a la limitación del tratamiento.' : 'Right to restriction of processing.'}</li>
                <li>{isEs ? 'Derecho a la portabilidad de los datos.' : 'Right to data portability.'}</li>
                <li>{isEs ? 'Derecho de oposición.' : 'Right to object.'}</li>
                <li>{isEs ? 'Derecho a retirar el consentimiento cuando el tratamiento se base en el consentimiento.' : 'Right to withdraw consent when processing is based on consent.'}</li>
              </ul>
              <p className="mb-2">{isEs ? 'Para ejercer estos derechos, el usuario puede contactar con GestInmo a través de:' : 'To exercise these rights, the user can contact GestInmo via:'}<br/>
              <a href="mailto:Appgestioninmuebles@gmail.com" className="text-blue-600 hover:underline">Appgestioninmuebles@gmail.com</a></p>
              <p className="mb-2">{isEs ? 'La solicitud deberá permitir identificar razonablemente al solicitante y especificar el derecho que desea ejercer.' : 'The request must reasonably identify the applicant and specify the right they wish to exercise.'}</p>
              <p className="mb-6">{isEs ? 'El usuario también tiene derecho a presentar una reclamación ante la autoridad de protección de datos competente, especialmente ante la Agencia Española de Protección de Datos (AEPD) cuando considere que el tratamiento de sus datos no se ajusta a la normativa aplicable.' : 'The user also has the right to lodge a complaint with the competent data protection authority, especially with the Spanish Data Protection Agency (AEPD), when considering that the processing of their data does not comply with applicable regulations.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '12. Datos de menores' : '12. Data of minors'}</h4>
              <p className="mb-2">{isEs ? 'GestInmo no está destinada específicamente a menores de edad.' : 'GestInmo is not specifically intended for minors.'}</p>
              <p className="mb-2">{isEs ? 'No se pretende recopilar deliberadamente información personal de menores que no puedan utilizar legalmente el servicio sin la correspondiente autorización.' : 'There is no intention to deliberately collect personal information from minors who cannot legally use the service without corresponding authorization.'}</p>
              <p className="mb-6">{isEs ? 'Si se detecta que se han recopilado datos personales de un menor de forma indebida, se adoptarán las medidas razonables para proceder a su eliminación cuando corresponda.' : 'If it is detected that a minor\'s personal data has been collected improperly, reasonable measures will be adopted to proceed with its deletion when appropriate.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '13. Cookies y almacenamiento local' : '13. Cookies and local storage'}</h4>
              <p className="mb-2">{isEs ? 'GestInmo puede utilizar mecanismos de almacenamiento local del dispositivo, como localStorage, para conservar determinadas preferencias del usuario, por ejemplo:' : 'GestInmo may use device local storage mechanisms, such as localStorage, to retain certain user preferences, for example:'}</p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>{isEs ? 'Preferencia de idioma.' : 'Language preference.'}</li>
                <li>{isEs ? 'Preferencia de apariencia o tema.' : 'Appearance or theme preference.'}</li>
                <li>{isEs ? 'Determinadas configuraciones de la aplicación.' : 'Certain application settings.'}</li>
              </ul>
              <p className="mb-2">{isEs ? 'Estos mecanismos tienen como finalidad mejorar el funcionamiento y la experiencia de usuario.' : 'The purpose of these mechanisms is to improve functioning and user experience.'}</p>
              <p className="mb-6">{isEs ? 'Asimismo, los servicios de autenticación utilizados por la aplicación pueden utilizar tecnologías necesarias para mantener de forma segura la sesión del usuario.' : 'Additionally, authentication services used by the application may use technologies necessary to securely maintain the user session.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '14. Exactitud de la información' : '14. Accuracy of information'}</h4>
              <p className="mb-2">{isEs ? 'El usuario será responsable de que los datos que introduzca en GestInmo sean correctos, completos y estén actualizados cuando resulte necesario.' : 'The user will be responsible for ensuring that the data entered in GestInmo is correct, complete, and updated when necessary.'}</p>
              <p className="mb-6">{isEs ? 'GestInmo no será responsable de las decisiones económicas, financieras, contractuales o de cualquier otra naturaleza que el usuario adopte basándose exclusivamente en los datos introducidos o cálculos realizados mediante la aplicación.' : 'GestInmo will not be responsible for economic, financial, contractual, or any other decisions adopted by the user based exclusively on the data entered or calculations performed through the application.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '15. Uso responsable de la aplicación' : '15. Responsible use of the application'}</h4>
              <p className="mb-2">{isEs ? 'El usuario se compromete a utilizar GestInmo de forma lícita y conforme a la normativa aplicable.' : 'The user commits to using GestInmo lawfully and in accordance with applicable regulations.'}</p>
              <p className="mb-6">{isEs ? 'No deberá utilizar la aplicación para introducir, almacenar o tratar información de forma ilícita o para vulnerar los derechos de otras personas.' : 'They must not use the application to illegally enter, store, or process information or to violate the rights of others.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '16. Cambios en esta Política de Privacidad' : '16. Changes to this Privacy Policy'}</h4>
              <p className="mb-2">{isEs ? 'GestInmo podrá actualizar esta Política de Privacidad cuando resulte necesario para adaptarla a cambios legislativos, técnicos o funcionales de la aplicación.' : 'GestInmo may update this Privacy Policy when necessary to adapt it to legislative, technical, or functional application changes.'}</p>
              <p className="mb-2">{isEs ? 'Cuando se produzcan modificaciones relevantes, se podrá informar a los usuarios mediante la propia aplicación u otros medios apropiados.' : 'When significant modifications occur, users may be informed via the application itself or other appropriate means.'}</p>
              <p className="mb-6">{isEs ? 'La fecha indicada al comienzo de esta política permitirá conocer cuándo fue realizada la última actualización.' : 'The date indicated at the beginning of this policy will allow knowing when the last update was made.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '17. Contacto' : '17. Contact'}</h4>
              <p className="mb-2">{isEs ? 'Para cualquier consulta relacionada con la privacidad, protección de datos o ejercicio de derechos, el usuario puede contactar con GestInmo mediante:' : 'For any query related to privacy, data protection, or the exercise of rights, the user may contact GestInmo via:'}<br/>
              {isEs ? 'GestInmo' : 'GestInmo'}<br/>
              <a href="mailto:Appgestioninmuebles@gmail.com" className="text-blue-600 hover:underline">Appgestioninmuebles@gmail.com</a></p>
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{isEs ? 'Manual de Usuario' : 'User Guide'}</h3>
              
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '1. Inicio (Dashboard)' : '1. Dashboard'}</h4>
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80" alt="Dashboard" className="rounded-xl w-full h-32 object-cover mb-3" />
              <p className="mb-4">{isEs ? 'Visualiza un resumen rápido de tus ingresos y gastos mensuales, la tasa de ocupación de tu portfolio y el beneficio neto anual estimado de todas tus propiedades.' : 'View a quick summary of your monthly income and expenses, portfolio occupancy rate, and estimated annual net profit across all your properties.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '2. Portfolio' : '2. Portfolio'}</h4>
              <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=500&q=80" alt="Portfolio" className="rounded-xl w-full h-32 object-cover mb-3" />
              <p className="mb-4">{isEs ? 'Añade, edita y revisa todas tus propiedades. Puedes adjuntar enlaces a tus contratos, escrituras e hipotecas directamente en la ficha de cada propiedad. Filtra rápidamente por estado (Ocupado, Vacío, etc.).' : 'Add, edit, and review all your properties. Attach links to contracts, deeds, and mortgages directly on each property card. Filter by status (Occupied, Vacant, etc.).'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '3. Inquilinos (CRM)' : '3. Tenants (CRM)'}</h4>
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=80" alt="CRM" className="rounded-xl w-full h-32 object-cover mb-3" />
              <p className="mb-4">{isEs ? 'Gestiona a las personas que alquilan tus propiedades. Lleva un control anual de los pagos mes a mes (Al día, Pendiente, Deuda) y revisa sus contratos vinculados.' : 'Manage tenants who lease your properties. Track monthly payments year-round (Paid, Pending, Debt) and review linked contracts.'}</p>

              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{isEs ? '4. Configuración' : '4. Settings'}</h4>
              <p className="mb-4">{isEs ? 'Desde tu perfil, edita tu nombre y foto. Cambia el tema (Claro u Oscuro) o el idioma. Exporta la información a PDF o Excel, y contacta con el soporte si tienes alguna incidencia.' : 'From your profile, update your name and avatar. Toggle theme (Light or Dark) or language. Export data to PDF or Excel, and contact support if you have any questions.'}</p>
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
                  <p className="text-slate-500 dark:text-slate-400 mb-4">{isEs ? 'Nos pondremos en contacto contigo pronto en tu correo.' : 'We will get back to you soon via email.'}</p>
                  <p className="text-xs text-slate-400">
                    {isEs ? 'Destinatario:' : 'Recipient:'} <span className="font-semibold text-slate-600 dark:text-slate-300">{supportEmail}</span>
                  </p>
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
            
            <p className="text-sm text-slate-500 dark:text-slate-400">{userEmail || 'ccaarrlos7@gmail.com'}</p>
            
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
                      {theme === 'Oscuro' || theme === 'Dark' ? <Moon size={16}/> : <Sun size={16}/>}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{isEs ? 'Tema Oscuro' : 'Dark Mode'}</div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">{isEs ? 'Apariencia visual' : 'Visual appearance'}</div>
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
