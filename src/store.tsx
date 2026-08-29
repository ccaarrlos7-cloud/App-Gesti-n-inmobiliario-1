import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Property, Tenant, Contract, Transaction, Issue } from './types';
import { supabase } from './lib/supabase';

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

// Helper to convert snake_case to camelCase
const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// Helper to convert camelCase to snake_case
const toSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnake(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [userName, setUserName] = useState("Carlos Hill Balsera");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [theme, setTheme] = useState("Claro");
  const [language, setLanguage] = useState("Español");
  
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [propsRes, tenantsRes, contractsRes, txsRes, issuesRes] = await Promise.all([
          supabase.from('properties').select('*'),
          supabase.from('tenants').select('*'),
          supabase.from('contracts').select('*'),
          supabase.from('transactions').select('*'),
          supabase.from('issues').select('*')
        ]);

        if (propsRes.data) setProperties(toCamel(propsRes.data));
        if (tenantsRes.data) setTenants(toCamel(tenantsRes.data));
        if (contractsRes.data) setContracts(toCamel(contractsRes.data));
        if (txsRes.data) setTransactions(toCamel(txsRes.data));
        if (issuesRes.data) setIssues(toCamel(issuesRes.data));
        
      } catch (e) {
        console.error("Error loading data from Supabase", e);
      } finally {
        setIsAppReady(true);
      }
    }
    loadData();
  }, []);

  const updateProperty = async (updatedProp: Property) => {
    // Optimistic update
    setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
    const data = toSnake(updatedProp);
    await supabase.from('properties').update(data).eq('id', data.id);
  };

  const addTenant = async (tenant: Tenant) => {
    setTenants(prev => [tenant, ...prev]);
    const data = toSnake(tenant);
    await supabase.from('tenants').insert(data);
  };

  const addContract = async (contract: Contract) => {
    setContracts(prev => [contract, ...prev]);
    const data = toSnake(contract);
    await supabase.from('contracts').insert(data);
  };

  const updateContract = async (updatedContract: Contract) => {
    setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
    const data = toSnake(updatedContract);
    await supabase.from('contracts').update(data).eq('id', data.id);
  };

  const addTransaction = async (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    const data = toSnake(tx);
    await supabase.from('transactions').insert(data);
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

    // For each contract, if Al día for that month, generate Rent
    contracts.forEach(c => {
      if (c.status === 'Activo') {
        for (let m = 1; m <= 12; m++) {
          const datePrefix = `${currentYear}-${m.toString().padStart(2, '0')}`;
          const currentStatus = c.monthlyPayments?.[datePrefix] || c.paymentStatus;
          
          if (currentStatus === 'Al día') {
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

  const addIssue = async (issue: Issue) => {
    setIssues(prev => [issue, ...prev]);
    const data = toSnake(issue);
    await supabase.from('issues').insert(data);
  };

  const updateIssue = async (updatedIssue: Issue) => {
    setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
    const data = toSnake(updatedIssue);
    await supabase.from('issues').update(data).eq('id', data.id);
  };

  const deleteIssue = async (id: string) => {
    setIssues(prev => prev.filter(i => i.id !== id));
    await supabase.from('issues').delete().eq('id', id);
  };

  if (!isAppReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold animate-pulse">Conectando a Supabase...</p>
      </div>
    );
  }

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
