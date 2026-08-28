const n1 = 1200;
const n2 = 1200.5;
console.log(n1.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true }));
console.log(n2.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true }));
