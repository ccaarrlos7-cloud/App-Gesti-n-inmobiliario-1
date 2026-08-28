const fs = require('fs');

let content = fs.readFileSync('src/components/CRMView.tsx', 'utf8');

const oldGeneralStatus = `<select 
                          className={\`px-2 py-0.5 rounded text-[11px] font-bold uppercase border-none focus:ring-1 focus:ring-blue-500 cursor-pointer
                          \${selectedContract.paymentStatus === 'Al día' ? 'bg-emerald-100 text-emerald-800' : 
                            selectedContract.paymentStatus === 'Pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}\`}
                          value={selectedContract.paymentStatus}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'Al día' | 'Pendiente' | 'Deuda';
                            const updated = { ...selectedContract, paymentStatus: newStatus };
                            setSelectedContract(updated);
                            updateContract(updated);
                          }}
                        >
                          <option value="Al día">Al día</option>
                          <option value="Pendiente">Pendiente</option>
                          <option value="Deuda">Deuda</option>
                        </select>`;

const newGeneralStatus = `<div className={\`px-2 py-0.5 rounded text-[11px] font-bold uppercase
                          \${selectedContract.paymentStatus === 'Al día' ? 'bg-emerald-100 text-emerald-800' : 
                            selectedContract.paymentStatus === 'Pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}\`}>
                          {selectedContract.paymentStatus}
                        </div>`;

content = content.replace(oldGeneralStatus, newGeneralStatus);

const oldOnChange = `onChange={(e) => {
                                const newStatus = e.target.value as 'Al día' | 'Pendiente' | 'Deuda';
                                const newMonthlyPayments = { ...(selectedContract.monthlyPayments || {}), [monthKey]: newStatus };
                                const updated = { ...selectedContract, monthlyPayments: newMonthlyPayments };
                                setSelectedContract(updated);
                                updateContract(updated);
                              }}`;

const newOnChange = `onChange={(e) => {
                                const newStatus = e.target.value as 'Al día' | 'Pendiente' | 'Deuda';
                                const newMonthlyPayments = { ...(selectedContract.monthlyPayments || {}), [monthKey]: newStatus };
                                
                                const values = Object.values(newMonthlyPayments);
                                let newGeneralStatus: 'Al día' | 'Pendiente' | 'Deuda' = 'Al día';
                                if (values.includes('Deuda')) {
                                  newGeneralStatus = 'Deuda';
                                } else if (values.includes('Pendiente')) {
                                  newGeneralStatus = 'Pendiente';
                                }
                                
                                const updated = { ...selectedContract, monthlyPayments: newMonthlyPayments, paymentStatus: newGeneralStatus };
                                setSelectedContract(updated);
                                updateContract(updated);
                              }}`;

content = content.replace(oldOnChange, newOnChange);

fs.writeFileSync('src/components/CRMView.tsx', content);
console.log('Fixed Estado General');
