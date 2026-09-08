import React, { useState, useEffect } from 'react';
import { useTenantContext } from '../store-tenant';
import { LogOut, FileText, FolderOpen, AlertCircle, MessageSquare, User, CheckCircle2, Clock, Calendar, Euro, Shield, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, formatNumber, formatChatDate } from '../utils';

import { resolveDocumentUrl } from '../lib/documentStorage';
import { DocumentActionButtons } from './DocumentActionButtons';
import { DocumentViewerModal } from './DocumentViewerModal';

type Tab = 'contract' | 'documents' | 'issues' | 'chat';

export default function TenantApp() {
  const { profile, contracts, issues, documents, addTenantIssue, getTenantIssueMessages, addTenantIssueMessage, getTenantChatMessages, addTenantChatMessage, unreadChatCount, loadUnreadChatCount } = useTenantContext();
  const isEs = true;
  const [activeTab, setActiveTab] = useState<Tab>('contract');
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
      alert(result.error || "Error al enviar mensaje");
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
      alert("Error al crear incidencia: " + (error || "Error desconocido"));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const currentContract = contracts && contracts.length > 0 ? contracts[0] : null;

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Portal del Inquilino</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {profile?.name || 'Inquilino'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-red-500 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors font-medium">
          <LogOut size={20} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col relative">
        <div className={`mx-auto w-full flex-1 flex flex-col min-h-0 ${activeTab === 'chat' ? 'max-w-3xl' : 'max-w-3xl overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6'}`}>
          
          {/* CONTENT BY TAB */}
          {activeTab === 'contract' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col justify-between pb-2">
              <h2 className="text-lg sm:text-xl font-bold shrink-0 mb-2 sm:mb-6 flex items-center gap-2">
                <FileText className="text-blue-600 dark:text-blue-400 sm:w-6 sm:h-6" size={20} /> Mi Contrato
              </h2>
              
              {!currentContract ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Shield size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Sin contrato vinculado</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    No tienes ningún contrato vinculado actualmente a tu cuenta. Contacta con tu propietario si crees que esto es un error.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-evenly gap-3 sm:gap-6">
                  {/* Resumen */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                    <div className="flex flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4 border-b border-slate-100 dark:border-slate-700 pb-3 sm:pb-6">
                      <div>
                        <p className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Propiedad alquilada</p>
                        <h3 className="text-base sm:text-xl font-bold leading-tight">{currentContract.propertyTitle || 'Propiedad vinculada'}</h3>
                        <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 line-clamp-1">{currentContract.propertyAddress}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 sm:px-4 py-1 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-2 font-bold text-xs sm:text-base border border-emerald-100 dark:border-emerald-800 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> {currentContract.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-6">
                      <div className="flex items-center sm:items-start gap-3 sm:gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 sm:p-3 rounded-xl shrink-0">
                          <Euro size={16} className="text-blue-600 dark:text-blue-400 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-0 sm:mb-1 truncate">Renta Mensual</p>
                          <p className="text-sm sm:text-2xl font-bold truncate">{formatNumber(currentContract.rentAmount)} €</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center sm:items-start gap-3 sm:gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 sm:p-3 rounded-xl shrink-0">
                          <Shield size={16} className="text-blue-600 dark:text-blue-400 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-0 sm:mb-1 truncate">Fianza</p>
                          <p className="text-sm sm:text-2xl font-bold truncate">{formatNumber(currentContract.deposit)} €</p>
                        </div>
                      </div>

                      <div className="flex items-center sm:items-start gap-3 sm:gap-4">
                        <div className="bg-slate-50 dark:bg-slate-700 p-1.5 sm:p-3 rounded-xl shrink-0">
                          <Calendar size={16} className="text-slate-600 dark:text-slate-400 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-0 sm:mb-1 truncate">Inicio</p>
                          <p className="font-bold text-[11px] sm:text-lg truncate">{formatDate(currentContract.startDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center sm:items-start gap-3 sm:gap-4">
                        <div className="bg-slate-50 dark:bg-slate-700 p-1.5 sm:p-3 rounded-xl shrink-0">
                          <Clock size={16} className="text-slate-600 dark:text-slate-400 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-0 sm:mb-1 truncate">Fin</p>
                          <p className="font-bold text-[11px] sm:text-lg truncate">
                            {currentContract.endDate ? formatDate(currentContract.endDate) : 'Indefinido'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ver Contrato (Documento Placeholder) */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                      <FileText className="text-slate-400 w-4 h-4 sm:w-6 sm:h-6" /> Documento del Contrato
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 sm:p-6 text-center border border-dashed border-slate-300 dark:border-slate-600">
                      <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400">
                        No hay un documento del contrato disponible todavía.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FolderOpen className="text-blue-600 dark:text-blue-400" /> Documentos Compartidos
              </h2>
              
              {!documents || documents.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                  <FolderOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Sin documentos</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {!currentContract 
                      ? "No tienes ningún contrato vinculado actualmente." 
                      : "No hay documentos compartidos contigo en este momento."}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{doc.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="text-blue-600 dark:text-blue-400" />
                  Incidencias
                </h2>
                {currentContract && (
                  <button
                    onClick={() => setShowIssueForm(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={16} /> Nueva
                  </button>
                )}
              </div>

              {!currentContract ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                  <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No tienes ningún contrato vinculado actualmente.</p>
                </div>
              ) : issues.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-300 dark:text-emerald-600 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Todo en orden</h3>
                  <p className="text-slate-500 dark:text-slate-400">No tienes incidencias registradas.</p>
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
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">{issue.description}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                          {formatDate(issue.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border flex items-center gap-1.5
                          ${issue.status === 'Abierta' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 
                            issue.status === 'En progreso' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${issue.status === 'Abierta' ? 'bg-amber-500' : issue.status === 'En progreso' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                          {issue.status}
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chat con Propietario</h2>
                <p className="text-sm text-slate-500">Comunícate directamente con tu propietario.</p>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700 min-h-0">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No hay mensajes. ¡Escribe el primero!</p>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.authorRole === 'inquilino' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          msg.authorRole === 'inquilino' 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs opacity-80">
                              {msg.authorRole === 'inquilino' ? 'Tú' : 'Propietario'}
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
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0 z-10 pb-safe">
        <div className="max-w-3xl mx-auto flex justify-around p-1 sm:p-2">
          <button 
            onClick={() => setActiveTab('contract')}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all ${
              activeTab === 'contract' 
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <FileText size={22} className="mb-1" />
            <span className="text-[11px] sm:text-xs">Contrato</span>
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
            <span className="text-[11px] sm:text-xs">Documentos</span>
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
            <span className="text-[11px] sm:text-xs">Incidencias</span>
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
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nueva Incidencia</h3>
              <button onClick={() => setShowIssueForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Asunto</label>
                <input 
                  type="text" 
                  value={issueForm.title}
                  onChange={e => setIssueForm({...issueForm, title: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Ej. Fuga de agua en el baño"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
                <textarea 
                  value={issueForm.description}
                  onChange={e => setIssueForm({...issueForm, description: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[120px] resize-none"
                  placeholder="Describe el problema con detalle..."
                  required
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowIssueForm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingIssue}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmittingIssue ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Enviando...</>
                  ) : (
                    'Crear Incidencia'
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
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-500" />
                {viewingIssue.title}
              </h3>
              <button onClick={() => setViewingIssue(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Descripción Original</h4>
                  <span className="text-xs text-slate-400">{formatDate(viewingIssue.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{viewingIssue.description}</p>
              </div>

              <div className="space-y-4 pt-2">
                {issueMessages.length === 0 ? (
                  <p className="text-sm text-center text-slate-500 py-4">No hay mensajes adicionales.</p>
                ) : (
                  issueMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.authorRole === 'inquilino' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.authorRole === 'inquilino' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-tl-sm'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {msg.authorRole === 'inquilino' ? 'Tú' : 'Propietario'} • {formatChatDate(msg.createdAt, isEs)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Añadir una respuesta..."
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 focus:border-blue-500 outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleSendMessage}
                  disabled={isSubmittingMessage || !newMessage.trim()}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
                >
                  {isSubmittingMessage ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
