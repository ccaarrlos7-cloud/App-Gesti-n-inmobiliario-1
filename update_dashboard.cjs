const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const oldAlerts = `  const expirationAlerts = contracts.filter(c => c.status === 'Activo').map(c => {
    const end = new Date(c.endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays >= 0 && diffDays <= 60) {
      const property = properties.find(p => p.id === c.propertyId);
      return {
        id: \`exp-\${c.id}\`,
        type: 'warning',
        title: \`Contrato próximo a vencer - \${property?.title || 'Inmueble'}\`,
        description: \`Vence el \${new Date(c.endDate).toLocaleDateString('es-ES')} (\${diffDays} días)\`,
        icon: 'calendar'
      };
    }
    return null;
  }).filter(Boolean);

  const notifications = [...paymentAlerts, ...expirationAlerts] as { id: string, type: 'error' | 'warning', title: string, description: string, icon: 'money' | 'calendar' }[];`;

const newAlerts = `  const expirationAlerts = contracts.filter(c => c.status === 'Activo').map(c => {
    const end = new Date(c.endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays >= 0 && diffDays <= 60) {
      const property = properties.find(p => p.id === c.propertyId);
      return {
        id: \`exp-\${c.id}\`,
        type: 'warning',
        title: \`Contrato próximo a vencer - \${property?.title || 'Inmueble'}\`,
        description: \`Vence el \${new Date(c.endDate).toLocaleDateString('es-ES')} (\${diffDays} días)\`,
        icon: 'calendar'
      };
    }
    return null;
  }).filter(Boolean);

  const issueAlerts = issues.filter(i => i.status !== 'Resuelta').map(i => {
    const property = properties.find(p => p.id === i.propertyId);
    return {
      id: \`iss-\${i.id}\`,
      type: i.status === 'Abierta' ? 'error' : 'warning',
      title: \`Incidencia \${i.status.toLowerCase()} - \${property?.title || 'Inmueble'}\`,
      description: i.title,
      icon: 'alert'
    };
  });

  const notifications = [...paymentAlerts, ...expirationAlerts, ...issueAlerts] as { id: string, type: 'error' | 'warning', title: string, description: string, icon: 'money' | 'calendar' | 'alert' }[];`;

content = content.replace(oldAlerts, newAlerts);

fs.writeFileSync('src/components/DashboardView.tsx', content);
console.log('Dashboard alerts updated');
