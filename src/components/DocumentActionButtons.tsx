import React from 'react';
import { Eye, Download, Trash2 } from 'lucide-react';

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
      
      <a 
        href={downloadUrl} 
        download={downloadName}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
        title="Descargar documento"
      >
        <Download size={18} />
      </a>
      
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
