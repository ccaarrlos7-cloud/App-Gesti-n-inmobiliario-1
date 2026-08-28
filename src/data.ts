import { Property, Tenant, Contract, MonthlyStats, Transaction, Issue } from './types';

export const mockProperties: Property[] = [
  {
    id: 'p1',
    title: 'Apartamento Centro Histórico',
    address: 'Calle Mayor 12, 3ºB',
    zipCode: '28013',
    city: 'Madrid',
    province: 'Madrid',
    price: 1200,
    status: 'Ocupado',
    type: 'Piso',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&auto=format&fit=crop&q=60',
    gallery: [],
    sqm: 85,
    rooms: 2,
    cadastralReference: '9872023VK4597S0001WA',
    purchaseDate: '2020-05-15',
    purchasePrice: 250000,
    downPayment: 50000,
    purchaseExpenses: 25000,
    renovationExpenses: 15000,
    hasMortgage: true,
    mortgageInstallment: 750
  },
  {
    id: 'p2',
    title: 'Chalet Las Rozas',
    address: 'Av. Atenas 45',
    zipCode: '28232',
    city: 'Las Rozas',
    province: 'Madrid',
    price: 2500,
    status: 'Vacío',
    type: 'Casa',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=60',
    sqm: 220,
    rooms: 4
  },
  {
    id: 'p3',
    title: 'Estudio Malasaña',
    address: 'Calle del Pez 8, 1ºA',
    city: 'Madrid',
    price: 850,
    status: 'En Reforma',
    type: 'Piso',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=500&auto=format&fit=crop&q=60',
    sqm: 45,
    rooms: 1,
    purchasePrice: 150000,
    renovationExpenses: 25000
  },
  {
    id: 'p4',
    title: 'Piso Retiro',
    address: 'Menéndez Pelayo 15, 4º Dcha',
    city: 'Madrid',
    price: 1800,
    status: 'Ocupado',
    type: 'Piso',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&auto=format&fit=crop&q=60',
    gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&auto=format&fit=crop&q=60'],
    sqm: 110,
    rooms: 3,
    hasMortgage: false
  },
  {
    id: 'p5',
    title: 'Local Comercial Salamanca',
    address: 'Goya 110',
    city: 'Madrid',
    price: 3200,
    status: 'En Venta',
    type: 'Local',
    image: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=500&auto=format&fit=crop&q=60',
    sqm: 150,
    rooms: 0
  },
];

export const mockTenants: Tenant[] = [
  {
    id: 't1',
    name: 'Laura Gómez',
    email: 'laura.gomez@email.com',
    phone: '+34 600 123 456',
    dni: '12345678A',
  },
  {
    id: 't2',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@email.com',
    phone: '+34 611 222 333',
    dni: '87654321B',
  },
  {
    id: 't3',
    name: 'María García (Compañera)',
    email: 'maria.g@email.com',
    phone: '+34 622 333 444',
    dni: '55667788C',
  }
];

export const mockContracts: Contract[] = [
  {
    id: 'c1',
    tenantIds: ['t1'],
    propertyId: 'p1',
    startDate: '2025-01-15',
    endDate: '2026-01-15',
    rentAmount: 1200,
    deposit: 2400,
    status: 'Activo',
    paymentStatus: 'Al día',
    monthlyPayments: {
      '2026-01': 'Al día',
      '2026-02': 'Al día',
      '2026-03': 'Al día',
      '2026-04': 'Al día',
      '2026-05': 'Al día',
      '2026-06': 'Al día',
      '2026-07': 'Al día',
      '2026-08': 'Al día',
    }
  },
  {
    id: 'c2',
    tenantIds: ['t2', 't3'],
    propertyId: 'p4',
    startDate: '2024-11-01',
    endDate: '2025-11-01',
    rentAmount: 1800,
    deposit: 3600,
    status: 'Activo',
    paymentStatus: 'Pendiente',
    monthlyPayments: {
      '2026-06': 'Al día',
      '2026-07': 'Al día',
      '2026-08': 'Pendiente',
    }
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tr1',
    propertyId: 'p1',
    type: 'ingreso',
    category: 'Alquiler',
    amount: 1200,
    date: '2026-08-01',
    description: 'Renta mensual Agosto'
  },
  {
    id: 'tr2',
    propertyId: 'p1',
    type: 'gasto',
    category: 'Reparación',
    amount: 350,
    date: '2026-08-05',
    description: 'Fontanería fuga baño'
  },
  {
    id: 'tr3',
    propertyId: 'p4',
    type: 'ingreso',
    category: 'Alquiler',
    amount: 1800,
    date: '2026-08-02',
    description: 'Renta mensual Agosto'
  },
  {
    id: 'tr4',
    propertyId: 'p4',
    type: 'gasto',
    category: 'Comunidad',
    amount: 120,
    date: '2026-08-10',
    description: 'Cuota ordinaria comunidad'
  }
];

export const mockIssues: Issue[] = [
  {
    id: 'iss1',
    propertyId: 'p2',
    title: 'Limpieza y pintura general',
    description: 'La casa está vacía pero necesita una mano de pintura y limpieza a fondo antes de nuevas visitas.',
    status: 'Abierta',
    createdAt: '2026-08-25'
  }
];

export const yearlyAnalytics = {
  2025: [
    { name: 'Ene', Ingresos: 4000, Gastos: 1200 },
    { name: 'Feb', Ingresos: 4000, Gastos: 800 },
    { name: 'Mar', Ingresos: 4500, Gastos: 1500 },
    { name: 'Abr', Ingresos: 4500, Gastos: 900 },
    { name: 'May', Ingresos: 4800, Gastos: 1100 },
    { name: 'Jun', Ingresos: 4800, Gastos: 1000 },
    { name: 'Jul', Ingresos: 5200, Gastos: 1400 },
    { name: 'Ago', Ingresos: 5200, Gastos: 850 },
    { name: 'Sep', Ingresos: 5500, Gastos: 2000 },
    { name: 'Oct', Ingresos: 5500, Gastos: 1200 },
    { name: 'Nov', Ingresos: 5800, Gastos: 1100 },
    { name: 'Dic', Ingresos: 6000, Gastos: 2500 },
  ],
  2026: [
    { name: 'Ene', Ingresos: 6000, Gastos: 1500 },
    { name: 'Feb', Ingresos: 6200, Gastos: 1000 },
    { name: 'Mar', Ingresos: 6500, Gastos: 1800 },
    { name: 'Abr', Ingresos: 6500, Gastos: 1100 },
    { name: 'May', Ingresos: 7000, Gastos: 1300 },
    { name: 'Jun', Ingresos: 7200, Gastos: 1200 },
    { name: 'Jul', Ingresos: 7500, Gastos: 1600 },
    { name: 'Ago', Ingresos: 7500, Gastos: 950 },
    { name: 'Sep', Ingresos: 8000, Gastos: 2200 },
    { name: 'Oct', Ingresos: 8200, Gastos: 1400 },
    { name: 'Nov', Ingresos: 8500, Gastos: 1300 },
    { name: 'Dic', Ingresos: 9000, Gastos: 2800 },
  ]
};
