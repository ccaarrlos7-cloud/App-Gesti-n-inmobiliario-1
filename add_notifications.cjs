const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// 1. Update lucide-react imports
content = content.replace(
  "import { ArrowUpRight, ArrowDownRight, X, AlertCircle, User, FileDown } from 'lucide-react';",
  "import { ArrowUpRight, ArrowDownRight, X, AlertCircle, User, FileDown, Bell, CalendarClock, AlertTriangle } from 'lucide-react';"
);

// 2. Update useAppContext
content = content.replace(
  "const { properties, getDynamicTransactions, issues, userName, avatarUrl, language } = useAppContext();",
  "const { properties, getDynamicTransactions, issues, userName, avatarUrl, language, contracts, tenants } = useAppContext();"
);

// 3. Insert notification logic right before return
const notifLogic = `
  const paymentAlerts = contracts.filter(c => c.status === 'Activo' && (c.paymentStatus === 'Deuda' || c.paymentStatus === 'Pendiente')).map(c => {
    const property = properties.find(p => p.id === c.propertyId);
    const tenantIds = c.tenantIds || [];
    const tenantNames = tenantIds.map(tId => tenants.find(t => t.id === tId)?.name || 'Desconocido').join(', ');
    return {
      id: \`pay-\${c.id}\`,
      type: c.paymentStatus === 'Deuda' ? 'error' : 'warning',
      title: \`Pago \${c.paymentStatus.toLowerCase()} - \${property?.title || 'Inmueble'}\`,
      description: \`Inquilino: \${tenantNames}\`,
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
        id: \`exp-\${c.id}\`,
        type: diffDays <= 15 ? 'error' : 'warning',
        title: \`Vencimiento en \${diffDays} días\`,
        description: property?.title || 'Inmueble',
        icon: 'calendar'
      };
    }
    return null;
  }).filter(Boolean);

  const notifications = [...paymentAlerts, ...expirationAlerts] as { id: string, type: 'error' | 'warning', title: string, description: string, icon: 'money' | 'calendar' }[];

  return (`;

content = content.replace("  return (", notifLogic);

// 4. Update the chart section JSX
const oldChartSection = `        <div className="bg-white p-5 rounded-xl border border-slate-200 flex-1 min-h-[400px] flex flex-col mb-6">
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
          
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataYear}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => formatNumber(val)} />
                <Tooltip
                  formatter={(value: any) => [\`\${formatNumber(Number(value))} €\`, undefined]} 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Gastos" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>`;

const newChartSection = `        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 flex-1 min-h-[400px]">
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
            
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataYear}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => formatNumber(val)} />
                  <Tooltip
                    formatter={(value: any) => [\`\${formatNumber(Number(value))} €\`, undefined]} 
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
                  <div key={notif.id} className={\`p-3 rounded-xl border \${notif.type === 'error' ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'} flex gap-3 items-start\`}>
                    <div className={\`mt-0.5 shrink-0 \${notif.type === 'error' ? 'text-red-500' : 'text-amber-500'}\`}>
                      {notif.icon === 'calendar' ? <CalendarClock size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={\`text-[13px] font-bold truncate \${notif.type === 'error' ? 'text-red-900' : 'text-amber-900'}\`}>
                        {notif.title}
                      </p>
                      <p className={\`text-[11px] mt-0.5 truncate \${notif.type === 'error' ? 'text-red-700/80' : 'text-amber-700/80'}\`}>
                        {notif.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>`;

content = content.replace(oldChartSection, newChartSection);
fs.writeFileSync('src/components/DashboardView.tsx', content);
console.log('Notifications added');
