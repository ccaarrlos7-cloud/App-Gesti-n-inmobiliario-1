import React, { useState } from 'react';
import { Eye, Download, Trash2, Loader2 } from 'lucide-react';
import { resolveDocumentUrl } from '../lib/documentStorage';

interface DocumentActionButtonsProps {
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  downloadUrl: string;
  downloadName: string;
}

export function DocumentActionButtons({
  onView,
  onDelete,
  downloadUrl,
  downloadName
}: DocumentActionButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      const url = await resolveDocumentUrl(downloadUrl);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading document:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onView();
        }}
        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
        title="Ver documento"
      >
        <Eye size={18} />
      </button>
      
      <button 
        onClick={handleDownloadClick}
        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
        title="Descargar documento"
        disabled={isDownloading}
      >
        {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
      </button>
      
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        title="Eliminar documento"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
