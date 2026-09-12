import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, X, AlertCircle, User, Bell, CalendarClock, AlertTriangle, Building2 } from 'lucide-react';
import { yearlyAnalytics } from '../data';
import { ViewType } from '../App';
import { PropertyStatus } from '../types';
import { useAppContext } from '../store';
import { formatDate, formatNumber, getContractTruePaymentStatus } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SettingsModal from './SettingsModal';

export default function DashboardView({ onNavigate }: { onNavigate?: (view: ViewType, filter?: PropertyStatus | 'Todos') => void }) {
  const { properties, getDynamicTransactions, issues, userName, avatarUrl, language, contracts, tenants } = useAppContext();
  const allTxs = getDynamicTransactions();
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [year, setYear] = useState<2025 | 2026>(2026);

  const isEs = language === 'Español';

  const monthsStr = isEs 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  

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

  const getPropertyTitle = (id: string) => properties.find(p => p.id === id)?.title || (isEs ? 'Desconocido' : 'Unknown');

  const paymentAlerts = contracts.filter(c => c.status === 'Activo' && getContractTruePaymentStatus(c) === 'Deuda').map(c => {
    const property = properties.find(p => p.id === c.propertyId);
    const tenantIds = c.tenantIds || [];
    const tenantNames = tenantIds.map(tId => tenants.find(t => t.id === tId)?.name || (isEs ? 'Desconocido' : 'Unknown')).join(', ');
    const statusText = isEs ? 'deuda' : 'debt';
    return {
      id: `pay-${c.id}`,
      type: 'error',
      title: `${isEs ? 'Pago en' : 'Payment in'} ${statusText} - ${property?.title || (isEs ? 'Inmueble' : 'Property')}`,
      description: `${isEs ? 'Inquilino' : 'Tenant'}: ${tenantNames}`,
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
        title: isEs ? `Vencimiento en ${diffDays} días` : `Expires in ${diffDays} days`,
        description: property?.title || (isEs ? 'Inmueble' : 'Property'),
        icon: 'calendar'
      };
    }
    return null;
  }).filter(Boolean);

  const issueAlerts = issues.filter(i => i.status !== 'Resuelta').map(i => {
    const property = properties.find(p => p.id === i.propertyId);
    return {
      id: `issue-${i.id}`,
      type: 'error',
      title: isEs ? 'Incidencia pendiente' : 'Pending issue',
      description: `${property?.title || (isEs ? 'Inmueble' : 'Property')} - ${i.title}`,
      icon: 'alert',
      onClick: () => onNavigate?.('portfolio')
    };
  });

  const notifications = [...paymentAlerts, ...expirationAlerts, ...issueAlerts] as { 
    id: string, 
    type: 'error' | 'warning', 
    title: string, 
    description: string, 
    icon: 'money' | 'calendar' | 'alert',
    onClick?: () => void 
  }[];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="min-h-[64px] py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm">
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FACC15] rounded-xl flex items-center justify-center text-slate-900 shadow-md shadow-[#FACC15]/20">
            <Building2 size={18} />
          </div>
          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white">{userName}</h1>
        </div>
        
        <div className="relative flex-1 min-w-[150px] sm:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FACC15] rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
            <Building2 size={16} />
          </div>
          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white truncate">{userName}</h1>
        </div>
        
        <div className="flex items-center gap-3">

          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-500 dark:text-slate-300" />
            )}
          </button>
        </div>
      </header>

      <div className="p-3 sm:p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        <section className="shrink-0">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-2.5">
            {isEs ? `Resumen de ${monthsStr[new Date().getMonth()]}` : `Summary for ${monthsStr[new Date().getMonth()]}`}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div 
              onClick={() => setShowIncomeModal(true)}
              className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-700 flex flex-col cursor-pointer hover:ring-[#FACC15] dark:hover:ring-[#FACC15] transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">{isEs ? 'Ingresos' : 'Income'}</div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 p-1.5 rounded-full group-hover:scale-110 transition-transform">
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatNumber(ingresosMes)} €</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1 group-hover:text-emerald-500 transition-colors">
                {isEs ? 'Ver desglose' : 'View breakdown'}
              </div>
            </div>
            
            <div 
              onClick={() => setShowExpenseModal(true)}
              className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-700 flex flex-col cursor-pointer hover:ring-[#FACC15] dark:hover:ring-[#FACC15] transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">{isEs ? 'Gastos' : 'Expenses'}</div>
                <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-500 p-1.5 rounded-full group-hover:scale-110 transition-transform">
                  <ArrowDownRight size={14} strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatNumber(gastosMes)} €</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1 group-hover:text-rose-500 transition-colors">
                {isEs ? 'Ver desglose' : 'View breakdown'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-700 flex flex-col">
              <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">{isEs ? 'Ocupación' : 'Occupancy'}</div>
              <div className="flex items-baseline gap-1.5 mb-2 mt-auto">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{ocupacion}%</span>
                <span className="text-[11px] text-slate-400 font-medium">({occupiedProperties.length}/{totalProps})</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-900 dark:bg-slate-400 h-full rounded-full transition-all" style={{ width: `${ocupacion}%` }} />
              </div>
            </div>

            <div 
              onClick={() => onNavigate?.('portfolio')}
              className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-700 flex flex-col cursor-pointer hover:ring-[#FACC15] dark:hover:ring-[#FACC15] transition-all duration-300 group"
            >
              <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">{isEs ? 'Incidencias' : 'Issues'}</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 mt-auto">{openIssuesCount}</div>
              {openIssuesCount > 0 ? (
                <div className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} strokeWidth={2.5} /> {isEs ? 'Requiere atención' : 'Requires attention'}
                </div>
              ) : (
                <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                  {isEs ? 'Todo en orden' : 'All good'}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="shrink-0">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-2.5">{isEs ? `Resumen Anual (${year})` : `Annual Summary (${year})`}</h2>
          <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 sm:p-6 rounded-2xl shadow-xl shadow-slate-900/20 flex flex-col relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FACC15] rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
            
            <div className="text-slate-400 text-[12px] font-bold uppercase tracking-wider mb-2">{isEs ? 'Beneficio Neto' : 'Net Profit'}</div>
            <div className="text-3xl sm:text-4xl font-black text-[#FACC15] tracking-tight">{formatNumber(beneficioAnual)} €</div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/50">
              <div>
                <div className="text-[11px] text-slate-500 uppercase font-bold mb-1">{isEs ? 'Ingresos Totales' : 'Total Income'}</div>
                <div className="font-bold text-[14px] text-emerald-400">{formatNumber(totalIngresosAnual)} €</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-500 uppercase font-bold mb-1">{isEs ? 'Gastos Totales' : 'Total Expenses'}</div>
                <div className="font-bold text-[14px] text-slate-300">{formatNumber(totalGastosAnual)} €</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 flex-1 min-h-[400px]">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isEs ? 'Rendimiento Anual' : 'Annual Performance'}</h3>
              <select 
                className="border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FACC15] cursor-pointer"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) as 2025 | 2026)}
              >
                <option value={2026}>{isEs ? 'Año 2026' : 'Year 2026'}</option>
                <option value={2025}>{isEs ? 'Año 2025' : 'Year 2025'}</option>
              </select>
            </div>
            
            <div className="flex-1 w-full relative min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataYear}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-20" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => formatNumber(val)} />
                  <Tooltip
                    formatter={(value: any) => [`${formatNumber(Number(value))} €`, undefined]} 
                    cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#1e293b', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: 12 }} />
                  <Bar name={isEs ? 'Ingresos' : 'Income'} dataKey="Ingresos" fill="#FACC15" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar name={isEs ? 'Gastos' : 'Expenses'} dataKey="Gastos" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Notifications Panel */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-full lg:max-h-[500px]">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Bell className="text-slate-700 dark:text-slate-400" size={18} />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isEs ? 'Avisos y Tareas' : 'Alerts & Tasks'}</h3>
              {notifications.length > 0 && (
                <span className="bg-[#FACC15] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shadow-sm">
                  {notifications.length}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2">
                  <Bell size={24} className="opacity-20" />
                  <p className="text-sm">{isEs ? 'Todo al día. No hay avisos.' : 'All up to date. No alerts.'}</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} onClick={notif.onClick} className={`p-3.5 rounded-xl border ${notif.onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ' : ''}${notif.type === 'error' ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100/50 dark:border-rose-900/30' : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100/50 dark:border-amber-900/30'} flex gap-3 items-start`}>
                    <div className={`mt-0.5 shrink-0 p-1.5 rounded-full ${notif.type === 'error' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'}`}>
                      {notif.icon === 'calendar' ? <CalendarClock size={14} strokeWidth={2.5} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-bold truncate ${notif.type === 'error' ? 'text-rose-900 dark:text-rose-300' : 'text-amber-900 dark:text-amber-300'}`}>
                        {notif.title}
                      </p>
                      <p className={`text-[12px] mt-0.5 truncate font-medium ${notif.type === 'error' ? 'text-rose-700/80 dark:text-rose-400/80' : 'text-amber-700/80 dark:text-amber-400/80'}`}>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300" onClick={() => setShowIncomeModal(false)}>
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 ring-1 ring-slate-200/50 dark:ring-slate-700" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-[16px]">{isEs ? 'Desglose de Ingresos' : 'Income Breakdown'}</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full p-1.5 transition-colors"><X size={18}/></button>
            </div>
            <div className="p-4 overflow-auto flex-1 divide-y divide-slate-100 dark:divide-slate-700">
              {ingresosDetalle.map(t => (
                <div key={t.id} className="py-3.5 flex justify-between items-center first:pt-1 last:pb-1">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-slate-900 dark:text-white text-[14px] truncate">{t.category}</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{getPropertyTitle(t.propertyId)}</p>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{formatNumber(t.amount)} €</span>
                </div>
              ))}
            </div>
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/30 flex justify-between items-center shrink-0">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 uppercase text-[12px]">{isEs ? 'Total Mensual' : 'Monthly Total'}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xl">{formatNumber(ingresosMes)} €</span>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300" onClick={() => setShowExpenseModal(false)}>
          <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 ring-1 ring-slate-200/50 dark:ring-slate-700" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-[16px]">{isEs ? 'Desglose de Gastos' : 'Expense Breakdown'}</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full p-1.5 transition-colors"><X size={18}/></button>
            </div>
            <div className="p-4 overflow-auto flex-1 divide-y divide-slate-100 dark:divide-slate-700">
              {gastosDetalle.map(g => (
                <div key={g.id} className="py-3.5 flex justify-between items-center first:pt-1 last:pb-1">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-slate-900 dark:text-white text-[14px] truncate">{g.category} - {g.description}</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{getPropertyTitle(g.propertyId)}</p>
                  </div>
                  <span className="font-bold text-red-500 dark:text-red-400 shrink-0">-{formatNumber(g.amount)} €</span>
                </div>
              ))}
            </div>
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-slate-700 bg-red-50 dark:bg-red-950/30 flex justify-between items-center shrink-0">
              <span className="font-bold text-red-900 dark:text-red-300 uppercase text-[12px]">{isEs ? 'Total Mensual' : 'Monthly Total'}</span>
              <span className="font-bold text-red-700 dark:text-red-400 text-xl">{formatNumber(gastosMes)} €</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
