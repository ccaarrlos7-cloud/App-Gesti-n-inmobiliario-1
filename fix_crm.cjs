const fs = require('fs');

const file = 'src/components/CRMView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace state
content = content.replace(
  "const [newTenant, setNewTenant] = useState<Partial<Tenant>>({ name: '', email: '', phone: '', dni: '' });",
  "const [newTenants, setNewTenants] = useState<Partial<Tenant>[]>([{ name: '', email: '', phone: '', dni: '' }]);"
);

// Replace form submission
const oldSubmit = `                // 1. Create Tenant
                const tenantId = \`t\${Date.now()}\`;
                const tenantToSave: Tenant = {
                  id: tenantId,
                  name: newTenant.name || '',
                  email: newTenant.email || '',
                  phone: newTenant.phone || '',
                  dni: newTenant.dni || ''
                };
                addTenant(tenantToSave);

                // 2. Create Contract
                const contractId = \`c\${Date.now()}\`;
                const contractToSave: Contract = {
                  id: contractId,
                  tenantIds: [tenantId],`;

const newSubmit = `                // 1. Create Tenants
                const createdTenantIds: string[] = [];
                newTenants.forEach((nt, index) => {
                  if (nt.name || nt.email) {
                    const tenantId = \`t\${Date.now()}-\${index}\`;
                    createdTenantIds.push(tenantId);
                    addTenant({
                      id: tenantId,
                      name: nt.name || '',
                      email: nt.email || '',
                      phone: nt.phone || '',
                      dni: nt.dni || ''
                    });
                  }
                });

                // 2. Create Contract
                const contractId = \`c\${Date.now()}\`;
                const contractToSave: Contract = {
                  id: contractId,
                  tenantIds: createdTenantIds.length > 0 ? createdTenantIds : [\`t\${Date.now()}\`],`;

content = content.replace(oldSubmit, newSubmit);

// Replace reset
content = content.replace(
  "setNewTenant({ name: '', email: '', phone: '', dni: '' });",
  "setNewTenants([{ name: '', email: '', phone: '', dni: '' }]);"
);

// Replace UI inputs for Tenant
const oldInputs = `                <div className="space-y-4 mb-6">
                  <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Datos del Inquilino</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nombre Completo *</label>
                      <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newTenant.name || ''} onChange={e => setNewTenant({...newTenant, name: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Email *</label>
                      <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newTenant.email || ''} onChange={e => setNewTenant({...newTenant, email: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Teléfono *</label>
                      <input type="tel" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newTenant.phone || ''} onChange={e => setNewTenant({...newTenant, phone: e.target.value})} required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">DNI / Pasaporte</label>
                      <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newTenant.dni || ''} onChange={e => setNewTenant({...newTenant, dni: e.target.value})} />
                    </div>
                  </div>
                </div>`;

const newInputs = `                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Datos de Inquilinos</h3>
                    <button 
                      type="button" 
                      onClick={() => setNewTenants([...newTenants, { name: '', email: '', phone: '', dni: '' }])}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Plus size={14} /> Añadir otro
                    </button>
                  </div>
                  {newTenants.map((nt, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl relative">
                      {newTenants.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setNewTenants(newTenants.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nombre Completo {index > 0 ? \`\${index + 1} \` : ''}*</label>
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nt.name || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Email *</label>
                        <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nt.email || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], email: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Teléfono *</label>
                        <input type="tel" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nt.phone || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], phone: e.target.value };
                          setNewTenants(updated);
                        }} required />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">DNI / Pasaporte</label>
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nt.dni || ''} onChange={e => {
                          const updated = [...newTenants];
                          updated[index] = { ...updated[index], dni: e.target.value };
                          setNewTenants(updated);
                        }} />
                      </div>
                    </div>
                  ))}
                </div>`;

content = content.replace(oldInputs, newInputs);

fs.writeFileSync(file, content);
console.log('CRMView updated');
