const fs = require('fs');
const file = 'src/components/DashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace(
  "import { ArrowUpRight, ArrowDownRight, X, AlertCircle, User } from 'lucide-react';",
  "import { ArrowUpRight, ArrowDownRight, X, AlertCircle, User, FileDown } from 'lucide-react';\nimport jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';"
);

// Add export function
const exportFunc = `
  const exportDashboardPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(\`Resumen Financiero y de Estado (\${year})\`, 14, 22);
    
    // KPIs
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(\`Ocupación actual: \${ocupacion}%\`, 14, 32);
    doc.text(\`Inmuebles totales: \${totalProps} (\${occupiedProperties.length} ocupados, \${vaciosCount} vacíos)\`, 14, 38);
    
    doc.text(\`Ingresos totales del año: \${formatNumber(totalIngresosAnual)} €\`, 14, 46);
    doc.text(\`Gastos totales del año: \${formatNumber(totalGastosAnual)} €\`, 14, 52);
    doc.text(\`Beneficio neto: \${formatNumber(beneficioAnual)} €\`, 14, 58);
    
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
    
    doc.save(\`resumen_financiero_\${year}.pdf\`);
  };
`;

content = content.replace(
  "const dataYear = monthsStr.map((m, i) => {",
  exportFunc + "\n  const dataYear = monthsStr.map((m, i) => {"
);

// Add Export button
content = content.replace(
  "{/* Placeholder invisible para igualar el espaciado si los otros tienen botón */}\n          <div className=\"w-[40px] sm:w-[150px] invisible hidden md:block\"></div>",
  `<button onClick={exportDashboardPDF} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <FileDown size={16} /> <span className="hidden sm:inline">Exportar PDF</span>
          </button>`
);

fs.writeFileSync(file, content);
console.log('Dashboard updated with PDF export');
