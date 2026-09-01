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

export function getContractTruePaymentStatus(monthlyPayments: Record<string, string> | undefined): 'Al día' | 'Pendiente' | 'Deuda' {
  if (!monthlyPayments) return 'Al día';
  
  const currentYearStr = new Date().getFullYear();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYearStr}-${currentMonthStr}`;

  let hasDeuda = false;
  let hasPendiente = false;

  for (const [monthKey, status] of Object.entries(monthlyPayments)) {
    if (status === 'Deuda') {
      hasDeuda = true;
    } else if (status === 'Pendiente') {
      if (monthKey < currentMonthKey) {
        // Unpaid past month is considered a debt
        hasDeuda = true;
      } else {
        // Unpaid current or future month is just pending
        hasPendiente = true;
      }
    }
  }

  if (hasDeuda) return 'Deuda';
  if (hasPendiente) return 'Pendiente';
  return 'Al día';
}
