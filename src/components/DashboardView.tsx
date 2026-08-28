import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, X, AlertCircle, User, FileDown, Bell, CalendarClock, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { yearlyAnalytics } from '../data';
import { ViewType } from '../App';
import { PropertyStatus } from '../types';
import { useAppContext } from '../store';
import { formatDate, formatNumber } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SettingsModal from './SettingsModal';

export default function DashboardView({ onNavigate }: { onNavigate?: (view: ViewType, filter?: PropertyStatus | 'Todos') => void }) {
  const { properties, getDynamicTransactions, issues, userName, avatarUrl, language, contracts, tenants } = useAppContext();
  const allTxs = getDynamicTransactions();
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [year, setYear] = useState<2025 | 2026>(2026);

  const monthsStr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const exportDashboardPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(`Resumen Financiero y de Estado (${year})`, 14, 22);
    
    // KPIs
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Ocupación actual: ${ocupacion}%`, 14, 32);
    doc.text(`Inmuebles totales: ${totalProps} (${occupiedProperties.length} ocupados, ${vaciosCount} vacíos)`, 14, 38);
    
    doc.text(`Ingresos totales del año: ${formatNumber(totalIngresosAnual)} €`, 14, 46);
    doc.text(`Gastos totales del año: ${formatNumber(totalGastosAnual)} €`, 14, 52);
    doc.text(`Beneficio neto: ${formatNumber(beneficioAnual)} €`, 14, 58);
    
    // Rendimiento Mensual Table
    autoTable(doc, {
      startY: 68,
      head: [['Mes', 'Ingresos (€)', 'Gastos (€)', 'Beneficio (€)']],
      body: dataYear.map(m => [
        m.name, 
        formatNumber(m.Ingresos), 
        formatNumber(m.Gastos), 
        formatNumber(m.Ingresos - m.Gastos)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Inmuebles Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Propiedad', 'Dirección', 'Estado', 'Renta (€)']],
      body: properties.map(p => [
        p.title,
        p.address,
        p.status,
        formatNumber(p.price || 0)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] },
    });
    
    doc.save(`resumen_financiero_${year}.pdf`);
  };

  const dataYear = monthsStr.map((m, i) => {
    const prefix = `${year}-${(i + 1).toString().padStart(2, '0')}`;
    const txs = allTxs.filter(t => t.date.startsWith(prefix));
    const Ingresos = txs.filter(t => t.type === 'ingreso').reduce((a, b) => a + b.amount, 0);
    const Gastos = txs.filter(t => t.type === 'gasto').reduce((a, b) => a + b.amount, 0);
    return { name: m, Ingresos, Gastos };
  });

  const totalIngresosAnual = dataYear.reduce((acc, curr) => acc + curr.Ingresos, 0);
  const totalGastosAnual = dataYear.reduce((acc, curr) => acc + curr.Gastos, 0);
  const beneficioAnual = totalIngresosAnual - totalGastosAnual;

  const occupiedProperties = properties.filter(p => p.status === 'Ocupado');
  
  const totalProps = properties.length;
  const ocupacion = Math.round((occupiedProperties.length / totalProps) * 100) || 0;
  const vaciosCount = properties.filter(p => p.status === 'Vacío').length;
  const openIssuesCount = issues.filter(i => i.status !== 'Resuelta').length;

  const currentMonth = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
  const currentMonthTransactions = allTxs.filter(t => t.date.startsWith(currentMonth));
  const ingresosDetalle = currentMonthTransactions.filter(t => t.type === 'ingreso');
  const gastosDetalle = currentMonthTransactions.filter(t => t.type === 'gasto');
  
  const ingresosMes = ingresosDetalle.reduce((acc, t) => acc + t.amount, 0);
  const gastosMes = gastosDetalle.reduce((acc, t) => acc + t.amount, 0);

  const getPropertyTitle = (id: string) => properties.find(p => p.id === id)?.title || 'Desconocido';


  const paymentAlerts = contracts.filter(c => c.status === 'Activo' && (c.paymentStatus === 'Deuda' || c.paymentStatus === 'Pendiente')).map(c => {
    const property = properties.find(p => p.id === c.propertyId);
    const tenantIds = c.tenantIds || [];
    const tenantNames = tenantIds.map(tId => tenants.find(t => t.id === tId)?.name || 'Desconocido').join(', ');
    return {
      id: `pay-${c.id}`,
      type: c.paymentStatus === 'Deuda' ? 'error' : 'warning',
      title: `Pago ${c.paymentStatus.toLowerCase()} - ${property?.title || 'Inmueble'}`,
      description: `Inquilino: ${tenantNames}`,
      icon: 'money'
    };
  });

  const expirationAlerts = contracts.filter(c => c.status === 'Activo').map(c => {
    const end = new Date(c.endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays >= 0 && diffDays <= 60) {
      const property = properties.find(p => p.id === c.propertyId);
      return {
        id: `exp-${c.id}`,
        type: diffDays <= 15 ? 'error' : 'warning',
        title: `Vencimiento en ${diffDays} días`,
        description: property?.title || 'Inmueble',
        icon: 'calendar'
      };
    }
    return null;
  }).filter(Boolean);

  const notifications = [...paymentAlerts, ...expirationAlerts] as { id: string, type: 'error' | 'warning', title: string, description: string, icon: 'money' | 'calendar' }[];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="min-h-[64px] py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[20px] font-bold text-slate-900 dark:text-white hidden sm:block">{userName}</h1>
        
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white sm:hidden">{userName}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={exportDashboardPDF} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <FileDown size={16} /> <span className="hidden sm:inline">Exportar PDF</span>
          </button>
          
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-500 dark:text-slate-300" />
            )}
          </button>
        </div>
      </header>

      {/* Changed to overflow-hidden and adjusted gaps/padding to fit nicely without scrolling */}
      <div className="p-3 sm:p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        <section className="shrink-0">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-2.5">{`Resumen de ${monthsStr[new Date().getMonth()]}`}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setShowIncomeModal(true)}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col cursor-pointer hover:border-emerald-300 transition-colors"
            >
              <div className="text-slate-500 text-[11px] font-semibold uppercase mb-1">Ingresos</div>
              <div className="text-lg font-bold text-slate-900 my-0.5">{formatNumber(ingresosMes)} €</div>
              <div className="text-[11px] text-emerald-500 flex items-center gap-1">
                <ArrowUpRight size={12} /> Ver desglose
              </div>
            </div>
            
            <div 
              onClick={() => setShowExpenseModal(true)}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col cursor-pointer hover:border-amber-300 transition-colors"
            >
              <div className="text-slate-500 text-[11px] font-semibold uppercase mb-1">Gastos</div>
              <div className="text-lg font-bold text-slate-900 my-0.5">{formatNumber(gastosMes)} €</div>
              <div className="text-[11px] text-amber-500 flex items-center gap-1">
                <ArrowDownRight size={12} /> Ver desglose
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="text-slate-500 text-[11px] font-semibold uppercase mb-1">Ocupación</div>
              <div className="flex items-baseline gap-1.5 my-0.5">
                <span className="text-lg font-bold text-slate-900">{ocupacion}%</span>
                <span className="text-[11px] text-slate-400 font-medium">({occupiedProperties.length} de {totalProps})</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${ocupacion}%` }} />
              </div>
            </div>

            <div 
              onClick={() => onNavigate?.('portfolio')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col cursor-pointer hover:border-red-300 transition-colors"
            >
              <div className="text-slate-500 text-[11px] font-semibold uppercase mb-1">Incidencias</div>
              <div className="text-lg font-bold text-slate-900 my-0.5">{openIssuesCount}</div>
              {openIssuesCount > 0 ? (
                <div className="text-[11px] font-bold text-red-500 flex items-center gap-1 mt-auto">
                  <AlertCircle size={12} /> Requiere atención
                </div>
              ) : (
                <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 mt-auto">
                  Todo en orden
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="shrink-0">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-2.5">Resumen Anual (2026)</h2>
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col">
            <div className="text-slate-400 text-[11px] font-semibold uppercase mb-1">Beneficio Neto</div>
            <div className="text-2xl font-bold">{formatNumber(beneficioAnual)} €</div>
            
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Ingresos Totales</div>
                <div className="font-semibold text-[13px] text-emerald-400">{formatNumber(totalIngresosAnual)} €</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Gastos Totales</div>
                <div className="font-semibold text-[13px] text-red-400">{formatNumber(totalGastosAnual)} €</div>
              </div>
            </div>
          </div>
        </section>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 flex-1 min-h-[400px]">
          <div className="bg-white p-5 rounded-xl border border-slate-200 lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-900">Rendimiento Anual</h3>
              <select 
                className="border border-slate-200 rounded text-slate-700 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) as 2025 | 2026)}
              >
                <option value={2026}>Año 2026</option>
                <option value={2025}>Año 2025</option>
              </select>
            </div>
            
            <div className="flex-1 w-full relative min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataYear}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => formatNumber(val)} />
                  <Tooltip
                    formatter={(value: any) => [`${formatNumber(Number(value))} €`, undefined]} 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: 12 }} />
                  <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="Gastos" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Notifications Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col h-full lg:max-h-[500px]">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Bell className="text-blue-600" size={18} />
              <h3 className="text-base font-semibold text-slate-900">Avisos y Tareas</h3>
              {notifications.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                  {notifications.length}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <Bell size={24} className="opacity-20" />
                  <p className="text-sm">Todo al día. No hay avisos.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`p-3 rounded-xl border ${notif.type === 'error' ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'} flex gap-3 items-start`}>
                    <div className={`mt-0.5 shrink-0 ${notif.type === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                      {notif.icon === 'calendar' ? <CalendarClock size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-bold truncate ${notif.type === 'error' ? 'text-red-900' : 'text-amber-900'}`}>
                        {notif.title}
                      </p>
                      <p className={`text-[11px] mt-0.5 truncate ${notif.type === 'error' ? 'text-red-700/80' : 'text-amber-700/80'}`}>
                        {notif.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[110] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowIncomeModal(false)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-[16px]">Desglose de Ingresos</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm"><X size={18}/></button>
            </div>
            <div className="p-4 overflow-auto flex-1 divide-y divide-slate-100">
              {ingresosDetalle.map(t => (
                <div key={t.id} className="py-3.5 flex justify-between items-center first:pt-1 last:pb-1">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-slate-900 text-[14px] truncate">{t.category}</p>
                    <p className="text-[12px] text-slate-500 truncate">{getPropertyTitle(t.propertyId)}</p>
                  </div>
                  <span className="font-bold text-emerald-600 shrink-0">{formatNumber(t.amount)} €</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-emerald-50 flex justify-between items-center shrink-0">
              <span className="font-bold text-emerald-900 uppercase text-[12px]">Total Mensual</span>
              <span className="font-bold text-emerald-700 text-xl">{formatNumber(ingresosMes)} €</span>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[110] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowExpenseModal(false)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-[16px]">Desglose de Gastos</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm"><X size={18}/></button>
            </div>
            <div className="p-4 overflow-auto flex-1 divide-y divide-slate-100">
              {gastosDetalle.map(g => (
                <div key={g.id} className="py-3.5 flex justify-between items-center first:pt-1 last:pb-1">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-slate-900 text-[14px] truncate">{g.category} - {g.description}</p>
                    <p className="text-[12px] text-slate-500 truncate">{getPropertyTitle(g.propertyId)}</p>
                  </div>
                  <span className="font-bold text-red-500 shrink-0">-{formatNumber(g.amount)} €</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-red-50 flex justify-between items-center shrink-0">
              <span className="font-bold text-red-900 uppercase text-[12px]">Total Mensual</span>
              <span className="font-bold text-red-700 text-xl">{formatNumber(gastosMes)} €</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
