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
