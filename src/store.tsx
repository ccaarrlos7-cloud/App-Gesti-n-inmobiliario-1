import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Property, Tenant, Contract, Transaction, Issue } from './types';
import { mockProperties, mockTenants, mockContracts, mockTransactions, mockIssues } from './data';

interface AppContextType {
  properties: Property[];
  setProperties: (props: Property[]) => void;
  updateProperty: (prop: Property) => void;
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Tenant) => void;
  contracts: Contract[];
  setContracts: (contracts: Contract[]) => void;
  addContract: (contract: Contract) => void;
  updateContract: (contract: Contract) => void;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  getDynamicTransactions: () => Transaction[];
  issues: Issue[];
  setIssues: (issues: Issue[]) => void;
  addIssue: (issue: Issue) => void;
  updateIssue: (issue: Issue) => void;
  deleteIssue: (id: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState(mockProperties);
  const [tenants, setTenants] = useState(mockTenants);
  const [contracts, setContracts] = useState(mockContracts);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [issues, setIssues] = useState(mockIssues);
  const [userName, setUserName] = useState("Carlos Hill Balsera");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [theme, setTheme] = useState("Claro");
  const [language, setLanguage] = useState("Español");

  const updateProperty = (updatedProp: Property) => {
    setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
  };

  const addTenant = (tenant: Tenant) => {
    setTenants(prev => [tenant, ...prev]);
  };

  const addContract = (contract: Contract) => {
    setContracts(prev => [contract, ...prev]);
  };

  const updateContract = (updatedContract: Contract) => {
    setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  };

  const getDynamicTransactions = () => {
    const dynamicTxs: Transaction[] = [...transactions];
    const currentYear = new Date().getFullYear();
    // For each property, generate 12 months of community and IBI (divided by 12)
    properties.forEach(p => {
      if (p.communityFees && p.communityFees > 0) {
        for (let m = 1; m <= 12; m++) {
          dynamicTxs.push({
            id: `auto-comm-${p.id}-${currentYear}-${m}`,
            propertyId: p.id,
            type: 'gasto',
            category: 'Comunidad',
            amount: p.communityFees,
            date: `${currentYear}-${m.toString().padStart(2, '0')}-01`,
            description: 'Cuota Comunidad (Auto)'
          });
        }
      }
      if (p.ibi && p.ibi > 0) {
        const monthlyIbi = p.ibi / 12;
        for (let m = 1; m <= 12; m++) {
          dynamicTxs.push({
            id: `auto-ibi-${p.id}-${currentYear}-${m}`,
            propertyId: p.id,
            type: 'gasto',
            category: 'Impuestos',
            amount: monthlyIbi,
            date: `${currentYear}-${m.toString().padStart(2, '0')}-01`,
            description: 'Proporción IBI (Auto)'
          });
        }
      }
      if (p.hasMortgage && p.mortgageInstallment && p.mortgageInstallment > 0) {
        for (let m = 1; m <= 12; m++) {
          dynamicTxs.push({
            id: `auto-mort-${p.id}-${currentYear}-${m}`,
            propertyId: p.id,
            type: 'gasto',
            category: 'Hipoteca',
            amount: p.mortgageInstallment,
            date: `${currentYear}-${m.toString().padStart(2, '0')}-01`,
            description: 'Cuota Hipoteca (Auto)'
          });
        }
      }
    });

    // For each contract, if Al día for that month, generate Rent for all months up to current (or all 12 if active?)
    // The prompt says "que los ingresos de alquileres solamente cuando pongamos que el inquilino esta al día en el pago"
    contracts.forEach(c => {
      if (c.status === 'Activo') {
        for (let m = 1; m <= 12; m++) {
          const datePrefix = `${currentYear}-${m.toString().padStart(2, '0')}`;
          
          // Check if the specific month is 'Al día'
          const currentStatus = c.monthlyPayments?.[datePrefix] || c.paymentStatus;
          
          if (currentStatus === 'Al día') {
            // We don't want to double count manual 'Alquiler' transactions for the same month/property.
            const existingManualRent = transactions.find(t => t.propertyId === c.propertyId && t.category === 'Alquiler' && t.date.startsWith(datePrefix));
            if (!existingManualRent) {
              dynamicTxs.push({
                id: `auto-rent-${c.id}-${currentYear}-${m}`,
                propertyId: c.propertyId,
                type: 'ingreso',
                category: 'Alquiler',
                amount: c.rentAmount,
                date: `${datePrefix}-01`,
                description: 'Alquiler (Auto - Al día)'
              });
            }
          }
        }
      }
    });

    return dynamicTxs.sort((a, b) => b.date.localeCompare(a.date));
  };

  const addIssue = (issue: Issue) => {
    setIssues(prev => [issue, ...prev]);
  };

  const updateIssue = (updatedIssue: Issue) => {
    setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
  };

  const deleteIssue = (id: string) => {
    setIssues(prev => prev.filter(i => i.id !== id));
  };

  return (
    <AppContext.Provider value={{ 
      properties, setProperties, updateProperty, 
      tenants, setTenants, addTenant,
      contracts, setContracts, addContract, updateContract,
      transactions, setTransactions, addTransaction, getDynamicTransactions,
      issues, setIssues, addIssue, updateIssue, deleteIssue,
      userName, setUserName,
      avatarUrl, setAvatarUrl,
      theme, setTheme,
      language, setLanguage
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
