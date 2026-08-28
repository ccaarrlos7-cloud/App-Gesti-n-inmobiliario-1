const fs = require('fs');
const file = 'src/components/CRMView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace(
  "import { X, Eye, Phone, Mail, FileText, CreditCard, Building2, Users, Plus, Upload, Trash2, Download, Paperclip } from 'lucide-react';",
  "import { X, Eye, Phone, Mail, FileText, CreditCard, Building2, Users, Plus, Upload, Trash2, Download, Paperclip, FileDown } from 'lucide-react';\nimport jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';"
);

// Add export function
const exportFunc = `
  const exportContractPDF = () => {
    if (!selectedContract) return;
    const doc = new jsPDF();
    const property = getPropertyInfo(selectedContract.propertyId);
    const contractTenants = getTenantsInfo(selectedContract.tenantIds);
    
    // Header
    doc.setFontSize(20);
    doc.text('Detalles del Contrato de Alquiler', 14, 22);
    
    // Inmueble Info
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(\`Inmueble: \${property?.title || 'Desconocido'}\`, 14, 34);
    doc.text(\`Dirección: \${property?.address || 'Desconocido'}\`, 14, 42);
    
    // Contrato Info
    doc.text(\`Vigencia: \${formatDate(selectedContract.startDate)} a \${formatDate(selectedContract.endDate)}\`, 14, 52);
    doc.text(\`Renta Mensual: \${formatNumber(selectedContract.rentAmount)} €\`, 14, 60);
    doc.text(\`Fianza: \${formatNumber(selectedContract.deposit)} €\`, 14, 68);
    doc.text(\`Estado General: \${selectedContract.paymentStatus}\`, 14, 76);
    
    // Inquilinos
    autoTable(doc, {
      startY: 86,
      head: [['Inquilino', 'Email', 'Teléfono', 'DNI']],
      body: contractTenants.map(t => [
        t?.name || '',
        t?.email || '',
        t?.phone || '',
        t?.dni || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] }
    });
    
    // Pagos del año actual
    const paymentYearStr = paymentYear.toString();
    const paymentData = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month, idx) => {
      const monthKey = \`\${paymentYear}-\${String(idx + 1).padStart(2, '0')}\`;
      const status = selectedContract.monthlyPayments?.[monthKey] || 'Pendiente';
      return [month, status];
    });
    
    doc.text(\`Control de Pagos (\${paymentYear})\`, 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Mes', 'Estado de Pago']],
      body: paymentData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(\`contrato_\${property?.title.replace(/\\s+/g, '_')}_\${selectedContract.id}.pdf\`);
  };
`;

content = content.replace(
  "const getPropertyInfo = (id: string) => properties.find(p => p.id === id);",
  "const getPropertyInfo = (id: string) => properties.find(p => p.id === id);\n" + exportFunc
);

// Add Export button
content = content.replace(
  "<button onClick={() => setSelectedContract(null)} className=\"text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm\">",
  `<button onClick={exportContractPDF} className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mr-2 transition-colors">
                  <FileDown size={14} /> Exportar
                </button>
                <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm">`
);

fs.writeFileSync(file, content);
console.log('CRMView updated with PDF export');
