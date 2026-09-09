import React, { useState, useEffect } from 'react';
import { useTenantContext } from '../store-tenant';
import { LogOut, FileText, FolderOpen, AlertCircle, MessageSquare, User, CheckCircle2, Clock, Calendar, Euro, Shield, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, formatNumber, formatChatDate, getContractTruePaymentStatus } from '../utils';

import { resolveDocumentUrl } from '../lib/documentStorage';
import { DocumentActionButtons } from './DocumentActionButtons';
import { DocumentViewerModal } from './DocumentViewerModal';
import { SettingsModalBase } from './SettingsModal';

type Tab = 'home' | 'documents' | 'issues' | 'chat';

export default function TenantApp() {
  const { profile, contracts, issues, documents, addTenantIssue, getTenantIssueMessages, addTenantIssueMessage, getTenantChatMessages, addTenantChatMessage, unreadChatCount, loadUnreadChatCount, theme, language } = useTenantContext();
  const isEs = language === 'Español';
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({ title: '', description: '' });
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [viewingIssue, setViewingIssue] = useState<any | null>(null);
  const [issueMessages, setIssueMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isSubmittingChatMessage, setIsSubmittingChatMessage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'Oscuro' || theme === 'Dark') {
      root.classList.add('dark');
    } else if (theme === 'Sistema' || theme === 'System') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (viewingIssue) {
      getTenantIssueMessages(viewingIssue.id).then(setIssueMessages);
    } else {
      setIssueMessages([]);
      setNewMessage('');
    }
  }, [viewingIssue, getTenantIssueMessages]);

  useEffect(() => {
    if (activeTab === 'chat' && profile) {
      supabase.rpc('mark_tenant_messages_as_read', { p_tenant_id: profile.id, p_role: 'inquilino' })
        .then(() => loadUnreadChatCount());
      getTenantChatMessages().then(setChatMessages);
    }
  }, [activeTab, getTenantChatMessages, profile, loadUnreadChatCount]);

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim()) return;
    setIsSubmittingChatMessage(true);
    const result = await addTenantChatMessage(newChatMessage);
    setIsSubmittingChatMessage(false);
    if (result.success) {
      setNewChatMessage('');
      getTenantChatMessages().then(setChatMessages);
    } else {
      alert(result.error || (isEs ? "Error al enviar mensaje" : "Error sending message"));
    }
  };

  const handleSendMessage = async () => {
    if (!viewingIssue || !newMessage.trim()) return;
    setIsSubmittingMessage(true);
    const { success } = await addTenantIssueMessage(viewingIssue.id, newMessage);
    setIsSubmittingMessage(false);
    if (success) {
      setNewMessage('');
      getTenantIssueMessages(viewingIssue.id).then(setIssueMessages);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentContract || !issueForm.title.trim() || !issueForm.description.trim()) return;
    setIsSubmittingIssue(true);
    const { success, error } = await addTenantIssue(currentContract.id, issueForm.title, issueForm.description);
    setIsSubmittingIssue(false);
    if (success) {
      setShowIssueForm(false);
      setIssueForm({ title: '', description: '' });
    } else {
      alert((isEs ? "Error al crear incidencia: " : "Error creating issue: ") + (error || (isEs ? "Error desconocido" : "Unknown error")));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const currentContract = contracts && contracts.length > 0 ? contracts[0] : null;

  const contractDoc = currentContract?.rentalContractUrl ? {
    id: 'main-contract',
    name: isEs ? 'Contrato de alquiler' : 'Rental agreement',
    storagePath: currentContract.rentalContractUrl,
    size: 0,
    createdAt: currentContract.startDate
  } : null;

  const filteredDocuments = documents.filter(doc => doc.storagePath !== contractDoc?.storagePath);
  const allDocuments = contractDoc ? [contractDoc, ...filteredDocuments] : filteredDocuments;

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans flex flex-col pt-[env(safe-area-inset-top)] transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center shrink-0 z-10 transition-colors">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors"
          >
            <User size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">{isEs ? 'Portal del Inquilino' : 'Tenant Portal'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
              {profile?.name || (isEs ? 'Inquilino' : 'Tenant')}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-red-500 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors font-medium">
          <LogOut size={20} />
          <span className="hidden sm:inline">{isEs ? 'Salir' : 'Sign Out'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col relative transition-colors">
        <div className={`mx-auto w-full flex-1 flex flex-col min-h-0 ${activeTab === 'chat' ? 'max-w-3xl' : 'max-w-3xl overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6'}`}>
          
          {/* CONTENT BY TAB */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col justify-start pb-2">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white transition-colors">
                {isEs ? 'Mi alquiler' : 'My rental'}
              </h2>
              
              {!currentContract ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 shadow-sm transition-colors mx-auto w-full max-w-sm mt-10">
                  <Shield size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4 transition-colors" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">{isEs ? 'Sin contrato vinculado' : 'No linked contract'}</h3>
                  <p className="text-slate-500 dark:text-slate-400 transition-colors text-sm">
                    {isEs 
                      ? 'No tienes ningún contrato vinculado actualmente a tu cuenta. Contacta con tu propietario si crees que esto es un error.' 
                      : 'You do not have any contract currently linked to your account. Contact your landlord if you think this is a mistake.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:gap-6 pb-6">
                  {/* Property Card */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center transition-colors">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 transition-colors">{isEs ? 'Propiedad' : 'Property'}</p>
                    <h3 className="text-xl sm:text-2xl font-bold leading-tight text-slate-900 dark:text-white mb-1 transition-colors">{currentContract.propertyTitle || (isEs ? 'Propiedad vinculada' : 'Linked property')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors line-clamp-1">{currentContract.propertyAddress}</p>
                  </div>

                  {/* 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Renta mensual */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center transition-colors h-28">
                      <Euro size={20} className="text-blue-500 dark:text-blue-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors">{isEs ? 'Renta mensual' : 'Monthly rent'}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 truncate w-full">{formatNumber(currentContract.rentAmount)} €</p>
                    </div>
                    {/* Fianza */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center transition-colors h-28">
                      <Shield size={20} className="text-blue-500 dark:text-blue-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors">{isEs ? 'Fianza' : 'Deposit'}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 truncate w-full">{formatNumber(currentContract.deposit)} €</p>
                    </div>
                    {/* Inicio */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center transition-colors h-28">
                      <Calendar size={20} className="text-slate-400 dark:text-slate-500 mb-2" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors">{isEs ? 'Inicio' : 'Start'}</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate w-full">{formatDate(currentContract.startDate)}</p>
                    </div>
                    {/* Fin */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center transition-colors h-28">
                      <Clock size={20} className="text-slate-400 dark:text-slate-500 mb-2" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors">{isEs ? 'Fin' : 'End'}</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate w-full">
                        {currentContract.endDate ? formatDate(currentContract.endDate) : (isEs ? 'Indefinido' : 'Indefinite')}
                      </p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  {(() => {
                    const trueStatus = getContractTruePaymentStatus(currentContract);
                    const statusColor = trueStatus === 'Al día' 
                      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                      : trueStatus === 'Pendiente'
                      ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50';
                      
                    const textColor = trueStatus === 'Al día' 
                      ? 'text-emerald-700 dark:text-emerald-400' 
                      : trueStatus === 'Pendiente'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-700 dark:text-red-400';

                    const iconColor = trueStatus === 'Al día' 
                      ? 'text-emerald-500 dark:text-emerald-400' 
                      : trueStatus === 'Pendiente'
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-red-500 dark:text-red-400';
                    
                    const label = isEs 
                      ? (trueStatus === 'Deuda' ? 'En deuda' : trueStatus)
                      : (trueStatus === 'Al día' ? 'Up to date' : trueStatus === 'Pendiente' ? 'Pending' : 'Debt');

                    return (
                      <div className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-colors ${statusColor}`}>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={24} className={iconColor} />
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 transition-colors ${textColor} opacity-80`}>
                              {isEs ? 'Estado del pago' : 'Payment status'}
                            </p>
                            <p className={`font-bold text-lg leading-none transition-colors ${textColor}`}>
                              {label}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FolderOpen className="text-blue-600 dark:text-blue-400" /> {isEs ? 'Documentos Compartidos' : 'Shared Documents'}
              </h2>
              
              {!allDocuments || allDocuments.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <FolderOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4 transition-colors" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">{isEs ? 'Sin documentos' : 'No documents'}</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto transition-colors">
                    {!currentContract 
                      ? (isEs ? "No tienes ningún contrato vinculado actualmente." : "You do not have any contract linked currently.")
                      : (isEs ? "No hay documentos compartidos contigo en este momento." : "There are no documents shared with you at this time.")}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700 transition-colors">
                    {allDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 transition-colors">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate transition-colors">{doc.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
                              {new Date(doc.createdAt).toLocaleDateString()} {doc.size ? `• ${(doc.size / 1024 / 1024).toFixed(2)} MB` : ''}
                            </p>
                          </div>
                        </div>
                        <DocumentActionButtons
                          onView={() => setViewingDoc({ url: `storage://${doc.storagePath}`, name: doc.name })}
                          onDownload={() => {}}
                          downloadUrl={`storage://${doc.storagePath}`}
                          downloadName={doc.name}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                  <AlertCircle className="text-blue-600 dark:text-blue-400" />
                  {isEs ? 'Incidencias' : 'Issues'}
                </h2>
                {currentContract && (
                  <button
                    onClick={() => setShowIssueForm(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={16} /> {isEs ? 'Nueva' : 'New'}
                  </button>
                )}
              </div>

              {!currentContract ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4 transition-colors" />
                  <p className="text-slate-500 dark:text-slate-400 transition-colors">{isEs ? 'No tienes ningún contrato vinculado actualmente.' : 'You do not have any contract linked currently.'}</p>
                </div>
              ) : issues.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-300 dark:text-emerald-600 mb-4 transition-colors" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">{isEs ? 'Todo en orden' : 'All good'}</h3>
                  <p className="text-slate-500 dark:text-slate-400 transition-colors">{isEs ? 'No tienes incidencias registradas.' : 'You have no recorded issues.'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => setViewingIssue(issue)}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-lg mb-1">{issue.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 transition-colors">{issue.description}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium transition-colors">
                          {formatDate(issue.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border flex items-center gap-1.5 transition-colors
                          ${issue.status === 'Abierta' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 
                            issue.status === 'En progreso' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${issue.status === 'Abierta' ? 'bg-amber-500' : issue.status === 'En progreso' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                          {isEs ? issue.status : (issue.status === 'Abierta' ? 'Open' : issue.status === 'En progreso' ? 'In progress' : 'Resolved')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col p-4 min-h-0">
              <div className="mb-4 shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">{isEs ? 'Chat con Propietario' : 'Chat with Landlord'}</h2>
                <p className="text-sm text-slate-500 transition-colors">{isEs ? 'Comunícate directamente con tu propietario.' : 'Communicate directly with your landlord.'}</p>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700 min-h-0 transition-colors">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 transition-colors">{isEs ? 'No hay mensajes. ¡Escribe el primero!' : 'No messages. Send the first one!'}</p>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.authorRole === 'inquilino' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 transition-colors ${
                          msg.authorRole === 'inquilino' 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs opacity-80">
                              {msg.authorRole === 'inquilino' ? (isEs ? 'Tú' : 'You') : (isEs ? 'Propietario' : 'Landlord')}
                            </span>
                            <span className="text-[10px] opacity-60">
                              {formatChatDate(msg.createdAt, isEs)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={e => setNewChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder={isEs ? "Escribe un mensaje..." : "Type a message..."}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  disabled={isSubmittingChatMessage}
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={!newChatMessage.trim() || isSubmittingChatMessage}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 rounded-xl transition-colors flex items-center justify-center shrink-0"
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
        {activeTab === 'chat' && <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent pointer-events-none transition-colors" />}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0 z-10 pb-[calc(env(safe-area-inset-bottom))] transition-colors">
        <div className="max-w-3xl mx-auto flex justify-around p-1 sm:p-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all ${
              activeTab === 'home' 
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <FileText size={22} className="mb-1" />
            <span className="text-[11px] sm:text-xs">{isEs ? 'Inicio' : 'Home'}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('documents')}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all ${
              activeTab === 'documents' 
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <FolderOpen size={22} className="mb-1" />
            <span className="text-[11px] sm:text-xs">{isEs ? 'Documentos' : 'Documents'}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('issues')}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all ${
              activeTab === 'issues' 
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <AlertCircle size={22} className="mb-1" />
            <span className="text-[11px] sm:text-xs">{isEs ? 'Incidencias' : 'Issues'}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all ${
              activeTab === 'chat' 
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <MessageSquare size={22} className="mb-1" />
              {unreadChatCount > 0 && activeTab !== 'chat' && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs">Chat</span>
          </button>
        </div>
      </nav>

      <DocumentViewerModal 
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        documentUrl={viewingDoc?.url || ''}
        documentName={viewingDoc?.name || ''}
      />

      {showIssueForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center items-center sm:p-4">
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">{isEs ? 'Nueva Incidencia' : 'New Issue'}</h3>
              <button onClick={() => setShowIssueForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">{isEs ? 'Asunto' : 'Subject'}</label>
                <input 
                  type="text" 
                  value={issueForm.title}
                  onChange={e => setIssueForm({...issueForm, title: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder={isEs ? "Ej. Fuga de agua en el baño" : "E.g. Water leak in bathroom"}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">{isEs ? 'Descripción' : 'Description'}</label>
                <textarea 
                  value={issueForm.description}
                  onChange={e => setIssueForm({...issueForm, description: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[120px] resize-none"
                  placeholder={isEs ? "Describe el problema con detalle..." : "Describe the issue in detail..."}
                  required
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowIssueForm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingIssue}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmittingIssue ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {isEs ? 'Enviando...' : 'Sending...'}</>
                  ) : (
                    isEs ? 'Crear Incidencia' : 'Create Issue'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detalle de Incidencia (Historial y Mensajes) */}
      {viewingIssue && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex flex-col justify-end sm:justify-center items-center sm:p-4">
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh] transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0 transition-colors">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                <MessageSquare size={20} className="text-blue-500" />
                {viewingIssue.title}
              </h3>
              <button onClick={() => setViewingIssue(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-900/50 space-y-6 transition-colors">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm transition-colors">{isEs ? 'Descripción Original' : 'Original Description'}</h4>
                  <span className="text-xs text-slate-400 transition-colors">{formatDate(viewingIssue.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap transition-colors">{viewingIssue.description}</p>
              </div>

              <div className="space-y-4 pt-2">
                {issueMessages.length === 0 ? (
                  <p className="text-sm text-center text-slate-500 py-4 transition-colors">{isEs ? 'No hay mensajes adicionales.' : 'No additional messages.'}</p>
                ) : (
                  issueMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.authorRole === 'inquilino' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 transition-colors ${msg.authorRole === 'inquilino' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-tl-sm'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1 transition-colors">
                        {msg.authorRole === 'inquilino' ? (isEs ? 'Tú' : 'You') : (isEs ? 'Propietario' : 'Landlord')} • {formatChatDate(msg.createdAt, isEs)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 transition-colors">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isEs ? "Añadir una respuesta..." : "Add a reply..."}
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 focus:border-blue-500 outline-none transition-colors"
                />
                <button 
                  type="button" 
                  onClick={handleSendMessage}
                  disabled={isSubmittingMessage || !newMessage.trim()}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
                >
                  {isSubmittingMessage ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isEs ? 'Enviar' : 'Send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Tenant Context) */}
      {showSettings && profile && (
        <SettingsModalBase
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          userName={profile.name}
          theme={theme}
          setTheme={useTenantContext().setTheme}
          language={language}
          setLanguage={useTenantContext().setLanguage}
          isTenant={true}
        />
      )}
    </div>
  );
}
