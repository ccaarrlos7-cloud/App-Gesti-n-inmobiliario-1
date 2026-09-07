export type UserRole = 'propietario' | 'inquilino';

export type PropertyStatus = 'Ocupado' | 'Vacío' | 'En Reforma' | 'En Venta';

export interface TenantSelfView {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileId: string;
}

export interface TenantContractView {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  deposit: number;
}

export interface TenantDocumentView {
  id: string;
  contractId: string;
  name: string;
  storagePath: string;
  size: number;
  createdAt: string;
}

export interface TenantIssueView {
  id: string;
  title: string;
  description: string;
  status: string;
  contractId: string;
  createdAt: string;
}
export interface Property {
  id: string;
  title: string;
  address: string;
  zipCode?: string;
  city?: string;
  province?: string;
  price: number;
  marketValue?: number;
  status: PropertyStatus;
  type: string;
  image: string;
  gallery?: string[];
  notes?: string;
  sqm?: number;
  rooms?: number;
  cadastralReference?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  downPayment?: number;
  purchaseExpenses?: number;
  renovationExpenses?: number;
  hasMortgage?: boolean;
  mortgageInstallment?: number;
  communityFees?: number;
  ibi?: number;
  purchaseDocumentUrl?: string;
  mortgageDocumentUrl?: string;
  rentalContractUrl?: string;
}

export interface PendingInvitation {
  id: string;
  tenantId: string;
  status: 'pending' | 'accepted' | 'revoked';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  dni?: string;
  profileId?: string;
}

export interface ContractDocument {
  id: string;
  contractId: string;
  name: string;
  storagePath: string;
  size: number;
  createdAt: string;
  sharedWithTenants: boolean;
}

export interface Contract {
  id: string;
  tenantIds: string[];
  propertyId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  deposit: number;
  status: 'Activo' | 'Finalizado' | 'Pendiente de firma';
  paymentStatus: 'Al día' | 'Pendiente' | 'Deuda';
  monthlyPayments?: Record<string, 'Al día' | 'Pendiente' | 'Deuda'>;
  documents?: { id: string; name: string; url: string; date: string; size?: number }[];
  contractDocuments?: ContractDocument[];
}

export type IssueStatus = 'Abierta' | 'En Progreso' | 'Resuelta';

export interface Issue {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  status: IssueStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  propertyId: string;
  type: 'ingreso' | 'gasto';
  category: string;
  amount: number;
  date: string;
  description: string;
  document?: string;
}

export interface MonthlyStats {
  month: string;
  revenue: number;
  expenses: number;
  occupancyRate: number;
  activeContracts: number;
}
