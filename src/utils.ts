import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '0,00 €';
  return amount.toLocaleString('es-ES', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'EUR'
  });
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (value === undefined || value === null) return '0';
  const numValue = Number(value);
  if (isNaN(numValue)) return '0';
  return numValue.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: true
  });
}

export function getContractTruePaymentStatus(contract: any): 'Al día' | 'Pendiente' | 'Deuda' {
  if (!contract) return 'Al día';
  const { monthlyPayments, startDate, endDate, status } = contract;
  
  const now = new Date();
  const currentYearStr = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYearStr}-${currentMonthStr}`;
  const currentDay = now.getDate();

  const startMonth = startDate ? startDate.slice(0, 7) : '';
  const endMonth = endDate ? endDate.slice(0, 7) : '';

  const isBeforeStart = startMonth && currentMonthKey < startMonth;
  const isAfterEnd = endMonth && currentMonthKey > endMonth;
  const isOutOfContract = isBeforeStart || isAfterEnd || status === 'Finalizado';

  let hasDeuda = false;
  let hasPendiente = false;

  // 1. Revisar los pagos registrados explícitamente en el historial
  if (monthlyPayments) {
    for (const [monthKey, st] of Object.entries(monthlyPayments)) {
      if (st === 'Deuda') {
        hasDeuda = true;
      } else if (st === 'Pendiente') {
        if (monthKey < currentMonthKey) {
          hasDeuda = true; // Pasados pendientes son deuda (lógica anterior)
        }
        // Ignoramos los futuros pendientes para que no afecten al estado general
      }
    }
  }

  // 2. Lógica específica para el mes actual si el contrato está en vigor
  if (!isOutOfContract) {
    const currentMonthStatus = monthlyPayments?.[currentMonthKey] || 'Pendiente';
    
    if (currentMonthStatus === 'Deuda') {
      hasDeuda = true;
    } else if (currentMonthStatus === 'Pendiente') {
      if (currentDay >= 5) {
        hasDeuda = true; // Día 5 o superior -> En deuda
      } else {
        hasPendiente = true; // Día 1 al 4 -> Pendiente
      }
    }
  }

  if (hasDeuda) return 'Deuda';
  if (hasPendiente) return 'Pendiente';
  return 'Al día';
}

export function formatChatDate(dateStr: string, isEs: boolean): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
                  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && 
                      date.getMonth() === yesterday.getMonth() && 
                      date.getFullYear() === yesterday.getFullYear();

  const timeString = date.toLocaleTimeString(isEs ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `${isEs ? 'Hoy' : 'Today'} · ${timeString}`;
  } else if (isYesterday) {
    return `${isEs ? 'Ayer' : 'Yesterday'} · ${timeString}`;
  } else {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year} · ${timeString}`;
  }
}

export const exportYearlyDataPDF = (
  year: number,
  properties: any[],
  allTxs: any[],
  language: string
) => {
  const isEs = language === 'Español';
  const monthsStr = isEs 
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
  const dataYear = monthsStr.map((m, i) => {
    const prefix = `${year}-${(i + 1).toString().padStart(2, '0')}`;
    const txs = allTxs.filter((t: any) => t.date.startsWith(prefix));
    const Ingresos = txs.filter((t: any) => t.type === 'ingreso').reduce((a: any, b: any) => a + b.amount, 0);
    const Gastos = txs.filter((t: any) => t.type === 'gasto').reduce((a: any, b: any) => a + b.amount, 0);
    return { name: m, Ingresos, Gastos };
  });

  const totalIngresosAnual = dataYear.reduce((acc, curr) => acc + curr.Ingresos, 0);
  const totalGastosAnual = dataYear.reduce((acc, curr) => acc + curr.Gastos, 0);
  const beneficioAnual = totalIngresosAnual - totalGastosAnual;

  const occupiedProperties = properties.filter(p => p.status === 'Ocupado');
  const totalProps = properties.length;
  const ocupacion = Math.round((occupiedProperties.length / totalProps) * 100) || 0;
  const vaciosCount = properties.filter(p => p.status === 'Vacío').length;

  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(isEs ? `Resumen Financiero y de Estado (${year})` : `Financial & Status Summary (${year})`, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${isEs ? 'Ocupación actual' : 'Current occupancy'}: ${ocupacion}%`, 14, 32);
  doc.text(`${isEs ? 'Inmuebles totales' : 'Total properties'}: ${totalProps} (${occupiedProperties.length} ${isEs ? 'ocupados' : 'occupied'}, ${vaciosCount} ${isEs ? 'vacíos' : 'vacant'})`, 14, 38);
  
  doc.text(`${isEs ? 'Ingresos totales del año' : 'Total annual income'}: ${formatNumber(totalIngresosAnual)} €`, 14, 46);
  doc.text(`${isEs ? 'Gastos totales del año' : 'Total annual expenses'}: ${formatNumber(totalGastosAnual)} €`, 14, 52);
  doc.text(`${isEs ? 'Beneficio neto' : 'Net profit'}: ${formatNumber(beneficioAnual)} €`, 14, 58);
  
  autoTable(doc, {
    startY: 68,
    head: [[isEs ? 'Mes' : 'Month', isEs ? 'Ingresos (€)' : 'Income (€)', isEs ? 'Gastos (€)' : 'Expenses (€)', isEs ? 'Beneficio (€)' : 'Profit (€)']],
    body: dataYear.map(m => [
      m.name, 
      formatNumber(m.Ingresos), 
      formatNumber(m.Gastos), 
      formatNumber(m.Ingresos - m.Gastos)
    ]),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    head: [[isEs ? 'Propiedad' : 'Property', isEs ? 'Dirección' : 'Address', isEs ? 'Estado' : 'Status', isEs ? 'Renta (€)' : 'Rent (€)']],
    body: properties.map(p => [
      p.title,
      p.address,
      p.status,
      formatNumber(p.price || 0)
    ]),
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85] },
  });
  
  doc.save(isEs ? `resumen_financiero_${year}.pdf` : `financial_summary_${year}.pdf`);
};
