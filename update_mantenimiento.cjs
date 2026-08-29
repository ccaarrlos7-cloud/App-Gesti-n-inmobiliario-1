const fs = require('fs');

let content = fs.readFileSync('src/components/PortfolioView.tsx', 'utf8');

// 1. Update viewMode state to include 'mantenimiento'
content = content.replace(
  "const [viewMode, setViewMode] = useState<'info' | 'contract' | 'edit' | 'finanzas'>('info');",
  "const [viewMode, setViewMode] = useState<'info' | 'contract' | 'edit' | 'finanzas' | 'mantenimiento'>('info');"
);

// 2. Add 'mantenimiento' to the tab switch inside viewMode === 'info' | 'finanzas' | 'mantenimiento'
const oldInfoTabs = `{viewMode === 'info' && (
                 <div className="flex border-b border-slate-200 bg-white">
                   <button onClick={() => setViewMode('info')} className="flex-1 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600">Info</button>
                   <button onClick={() => setViewMode('finanzas')} className="flex-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700">Finanzas</button>
                 </div>
               )}`;
               
const oldFinanzasTabs = `{viewMode === 'finanzas' && (
                 <div className="flex border-b border-slate-200 bg-white">
                   <button onClick={() => setViewMode('info')} className="flex-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700">Info</button>
                   <button onClick={() => setViewMode('finanzas')} className="flex-1 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600">Finanzas</button>
                 </div>
               )}`;

const unifiedTabs = `
               {['info', 'finanzas', 'mantenimiento'].includes(viewMode) && (
                 <div className="flex border-b border-slate-200 bg-white">
                   <button onClick={() => setViewMode('info')} className={\`flex-1 py-3 text-[13px] \${viewMode === 'info' ? 'font-bold text-blue-600 border-b-2 border-blue-600' : 'font-semibold text-slate-500 hover:text-slate-700'}\`}>Info</button>
                   <button onClick={() => setViewMode('finanzas')} className={\`flex-1 py-3 text-[13px] \${viewMode === 'finanzas' ? 'font-bold text-blue-600 border-b-2 border-blue-600' : 'font-semibold text-slate-500 hover:text-slate-700'}\`}>Finanzas</button>
                   <button onClick={() => setViewMode('mantenimiento')} className={\`flex-1 py-3 text-[13px] \${viewMode === 'mantenimiento' ? 'font-bold text-blue-600 border-b-2 border-blue-600' : 'font-semibold text-slate-500 hover:text-slate-700'}\`}>Mantenimiento</button>
                 </div>
               )}`;

content = content.replace(oldInfoTabs, unifiedTabs);
content = content.replace(oldFinanzasTabs, "");

// 3. Move the propertyIssues rendering from 'info' to 'mantenimiento'
const propertyIssuesJSX = `
                       <div className="mb-6">
                         <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                           <h3 className="font-bold text-slate-900 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500"/> Mantenimiento y Alertas</h3>
                           <button 
                             onClick={() => {
                               setIssueForm({ title: '', description: '', status: 'Abierta', propertyId: selectedProperty.id });
                               setEditingIssueId(null);
                               setShowIssueForm(true);
                             }}
                             className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                           >
                             + Añadir Incidencia
                           </button>
                         </div>
                         {propertyIssues.length === 0 ? (
                           <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center text-slate-400 text-sm">
                             No hay incidencias registradas
                           </div>
                         ) : (
                           <div className="space-y-3">
                             {propertyIssues.map(issue => (
                               <div key={issue.id} onClick={() => handleEditIssue(issue)} className="bg-white border border-red-200 shadow-sm p-4 rounded-xl relative hover:border-red-300 transition-colors cursor-pointer group">
                                 <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{issue.title}</h4>
                                 </div>
                                 <p className="text-xs text-slate-600 leading-relaxed mb-3">{issue.description}</p>
                                 <div className="flex items-center justify-between text-[11px] font-semibold">
                                   <span className="text-slate-400">{formatDate(issue.createdAt)}</span>
                                   <span className={\`px-2 py-1 rounded-full \${issue.status === 'Resuelta' ? 'bg-emerald-100 text-emerald-700' : issue.status === 'En Progreso' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}\`}>
                                     {issue.status}
                                   </span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>`;

content = content.replace(propertyIssuesJSX, "");

const mantenimientoTab = `
                  {viewMode === 'mantenimiento' && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><AlertTriangle size={20} className="text-amber-500"/> Mantenimiento y Alertas</h3>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col items-center justify-center text-center">
                          <p className="text-sm text-slate-500 mb-4 max-w-sm">
                            Gestiona las incidencias, reparaciones o alertas vinculadas a este inmueble. Al resolverlas, podrás generar un gasto automáticamente.
                          </p>
                          <button 
                             onClick={() => {
                               setIssueForm({ title: '', description: '', status: 'Abierta', propertyId: selectedProperty.id, cost: 0, generateTransaction: false });
                               setEditingIssueId(null);
                               setShowIssueForm(true);
                             }}
                             className="px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg shadow-sm hover:bg-slate-800 flex items-center gap-2"
                           >
                             <Plus size={16} /> Registrar Nueva Incidencia
                           </button>
                        </div>
                        
                        {propertyIssues.length === 0 ? (
                           <div className="bg-slate-50 border border-slate-100 p-8 rounded-xl text-center text-slate-400 text-sm">
                             <CheckCircle size={32} className="mx-auto mb-3 text-slate-300" />
                             Todo perfecto. No hay incidencias registradas en este momento.
                           </div>
                         ) : (
                           <div className="space-y-4">
                             {propertyIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(issue => (
                               <div key={issue.id} onClick={() => handleEditIssue(issue)} className={\`bg-white border shadow-sm p-4 rounded-xl relative transition-colors cursor-pointer group \${issue.status === 'Resuelta' ? 'border-slate-200 hover:border-slate-300' : 'border-amber-200 hover:border-amber-300'}\`}>
                                 <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                     {issue.status === 'Resuelta' ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500"/>}
                                     {issue.title}
                                   </h4>
                                 </div>
                                 <p className="text-sm text-slate-600 leading-relaxed mb-4">{issue.description}</p>
                                 <div className="flex items-center justify-between text-[11px] font-semibold border-t border-slate-100 pt-3">
                                   <span className="text-slate-400">Fecha reporte: {formatDate(issue.createdAt)}</span>
                                   <span className={\`px-3 py-1 rounded-full \${issue.status === 'Resuelta' ? 'bg-emerald-100 text-emerald-700' : issue.status === 'En Progreso' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}\`}>
                                     {issue.status}
                                   </span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                     </div>
                  )}
`;

content = content.replace("{viewMode === 'finanzas' && (", mantenimientoTab + "\n                  {viewMode === 'finanzas' && (");

// 4. Update the issueForm state to include optional transaction fields
content = content.replace(
  "const [issueForm, setIssueForm] = useState({ title: '', description: '', status: 'Abierta' as const, propertyId: '' });",
  "const [issueForm, setIssueForm] = useState({ title: '', description: '', status: 'Abierta' as const, propertyId: '', cost: 0, generateTransaction: false });"
);

// 5. Update handleSaveIssue
const handleSaveIssueRegex = /const handleSaveIssue = \(\) => \{[\s\S]*?setIssueForm\(\{ title: '', description: '', status: 'Abierta', propertyId: '' \}\);\s*\};/g;

const newHandleSaveIssue = `const handleSaveIssue = () => {
    if (!issueForm.title.trim() || !issueForm.propertyId) return;
    
    if (editingIssueId) {
      updateIssue({
        id: editingIssueId,
        propertyId: issueForm.propertyId,
        title: issueForm.title,
        description: issueForm.description,
        status: issueForm.status,
        createdAt: issues.find(i => i.id === editingIssueId)?.createdAt || new Date().toISOString().split('T')[0]
      });
    } else {
      addIssue({
        id: \`iss\${Date.now()}\`,
        propertyId: issueForm.propertyId,
        title: issueForm.title,
        description: issueForm.description,
        status: issueForm.status,
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    
    // Auto-generate transaction if requested
    if (issueForm.status === 'Resuelta' && issueForm.generateTransaction && issueForm.cost > 0) {
      addTransaction({
        id: \`tr\${Date.now()}\`,
        propertyId: issueForm.propertyId,
        type: 'gasto',
        category: 'Mantenimiento / Reparación',
        amount: Number(issueForm.cost) || 0,
        date: new Date().toISOString().split('T')[0],
        description: \`[Resolución Incidencia] \${issueForm.title}\`
      });
    }
    
    setShowIssueForm(false);
    setEditingIssueId(null);
    setIssueForm({ title: '', description: '', status: 'Abierta', propertyId: '', cost: 0, generateTransaction: false });
  };`;

content = content.replace(handleSaveIssueRegex, newHandleSaveIssue);

// 6. Update handleEditIssue
content = content.replace(
  "setIssueForm({ title: issue.title, description: issue.description, status: issue.status, propertyId: issue.propertyId });",
  "setIssueForm({ title: issue.title, description: issue.description, status: issue.status, propertyId: issue.propertyId, cost: 0, generateTransaction: false });"
);

// 7. Update the Modal UI to include the new fields
const oldModalStatus = `              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                <select 
                  value={issueForm.status}
                  onChange={(e) => setIssueForm({...issueForm, status: e.target.value as any})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="Abierta">Abierta (Pendiente)</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Resuelta">Resuelta</option>
                </select>
              </div>`;

const newModalStatus = `              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                <select 
                  value={issueForm.status}
                  onChange={(e) => setIssueForm({...issueForm, status: e.target.value as any})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="Abierta">Abierta (Pendiente)</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Resuelta">Resuelta</option>
                </select>
              </div>
              
              {issueForm.status === 'Resuelta' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={issueForm.generateTransaction}
                      onChange={(e) => setIssueForm({...issueForm, generateTransaction: e.target.checked})}
                    />
                    <div className="flex-1">
                      <span className="block text-sm font-bold text-slate-900 mb-0.5">Generar gasto automáticamente</span>
                      <span className="block text-xs text-slate-600 mb-3">Registrar esta reparación en las finanzas del inmueble.</span>
                      
                      {issueForm.generateTransaction && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase">Coste:</span>
                          <input 
                            type="number" 
                            className="flex-1 max-w-[120px] border border-slate-200 rounded p-1.5 text-sm bg-white"
                            placeholder="Importe (€)"
                            value={issueForm.cost || ''}
                            onChange={(e) => setIssueForm({...issueForm, cost: Number(e.target.value)})}
                          />
                          <span className="text-sm font-semibold text-slate-700">€</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}`;

content = content.replace(oldModalStatus, newModalStatus);

// Also missing importing Plus and CheckCircle from lucide-react. Let's check imports.
content = content.replace(
  "import { Search, MapPin, Euro, Plus, Building2, ExternalLink, X, Calendar, User, FileText, Settings, Upload, Eye, Check, Edit, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Paperclip, Copy, ChevronLeft } from 'lucide-react';",
  "import { Search, MapPin, Euro, Plus, Building2, ExternalLink, X, Calendar, User, FileText, Settings, Upload, Eye, Check, Edit, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Paperclip, Copy, ChevronLeft, CheckCircle } from 'lucide-react';"
);

fs.writeFileSync('src/components/PortfolioView.tsx', content);
console.log('Mantenimiento integrated');
