import React, { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { resolveDocumentUrl } from '../lib/documentStorage';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
}

export function DocumentViewerModal({ isOpen, onClose, documentUrl, documentName }: DocumentViewerModalProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Resolve storage:// URLs to Signed URLs
  useEffect(() => {
    if (!isOpen || !documentUrl) return;
    
    let isMounted = true;
    const fetchUrl = async () => {
      setIsLoading(true);
      try {
        const url = await resolveDocumentUrl(documentUrl);
        if (isMounted) setResolvedUrl(url);
      } catch (e) {
        console.error("Failed to resolve URL:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchUrl();
    return () => { isMounted = false; };
  }, [isOpen, documentUrl]);

  if (!isOpen || !documentUrl) return null;

  // Determine file type from resolved string or original string if base64
  const isImage = documentUrl.startsWith('data:image/') || resolvedUrl.includes('.jpg') || resolvedUrl.includes('.png') || resolvedUrl.includes('.jpeg') || documentUrl.toLowerCase().match(/\.(jpg|jpeg|png)$/);
  const isPdf = documentUrl.startsWith('data:application/pdf') || resolvedUrl.includes('.pdf') || documentUrl.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white truncate pr-4 text-lg">
            {documentName}
          </h3>
          <div className="flex items-center gap-3 shrink-0">
            {resolvedUrl && (
              <a 
                href={resolvedUrl} 
                download={documentName}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Descargar</span>
              </a>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-black/50 p-4 md:p-6 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="animate-spin" size={32} />
              <p>Cargando documento...</p>
            </div>
          ) : !resolvedUrl ? (
            <div className="text-center text-red-500 flex flex-col items-center gap-3">
              <p>Error al cargar el documento.</p>
            </div>
          ) : isImage ? (
            <img 
              src={resolvedUrl} 
              alt={documentName} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />
          ) : isPdf ? (
            <iframe 
              src={resolvedUrl} 
              title={documentName}
              className="w-full h-full rounded-lg shadow-sm bg-white"
            />
          ) : (
            <div className="text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
              <p>Formato de documento no soportado para previsualización directa.</p>
              <a 
                href={resolvedUrl} 
                download={documentName}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Download size={16} /> Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
