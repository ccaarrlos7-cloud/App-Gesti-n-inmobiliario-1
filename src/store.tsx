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
  const [theme, setThemeState] = useState<string>(() => {
    try {
      return localStorage.getItem('app_theme') || 'Claro';
    } catch {
      return 'Claro';
    }
  });
  const [language, setLanguageState] = useState<string>(() => {
    try {
      return localStorage.getItem('app_language') || 'Español';
    } catch {
      return 'Español';
    }
  });

  const setTheme = (t: string) => {
    setThemeState(t);
    try {
      localStorage.setItem('app_theme', t);
    } catch {}
  };

  const setLanguage = (l: string) => {
    setLanguageState(l);
    try {
      localStorage.setItem('app_language', l);
    } catch {}
  };
  
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

  const sanitizeProperty = (p: Property): Property => ({
    ...p,
    price: Math.max(0, Number(p.price) || 0),
    marketValue: p.marketValue !== undefined ? Math.max(0, Number(p.marketValue) || 0) : undefined,
    sqm: p.sqm !== undefined ? Math.max(0, Number(p.sqm) || 0) : undefined,
    rooms: p.rooms !== undefined ? Math.max(0, Math.floor(Number(p.rooms) || 0)) : undefined,
    purchasePrice: p.purchasePrice !== undefined ? Math.max(0, Number(p.purchasePrice) || 0) : undefined,
    downPayment: p.downPayment !== undefined ? Math.max(0, Number(p.downPayment) || 0) : undefined,
    purchaseExpenses: p.purchaseExpenses !== undefined ? Math.max(0, Number(p.purchaseExpenses) || 0) : undefined,
    renovationExpenses: p.renovationExpenses !== undefined ? Math.max(0, Number(p.renovationExpenses) || 0) : undefined,
    mortgageInstallment: p.mortgageInstallment !== undefined ? Math.max(0, Number(p.mortgageInstallment) || 0) : undefined,
    communityFees: p.communityFees !== undefined ? Math.max(0, Number(p.communityFees) || 0) : undefined,
    ibi: p.ibi !== undefined ? Math.max(0, Number(p.ibi) || 0) : undefined,
  });

  const sanitizeContract = (c: Contract): Contract => ({
    ...c,
    rentAmount: Math.max(0, Number(c.rentAmount) || 0),
    deposit: Math.max(0, Number(c.deposit) || 0),
  });

  const sanitizeTransaction = (tx: Transaction): Transaction => ({
    ...tx,
    amount: Math.max(0, Number(tx.amount) || 0),
  });

  const updateProperty = async (updatedProp: Property) => {
    const sanitized = sanitizeProperty(updatedProp);
    // Optimistic update
    setProperties(prev => prev.map(p => p.id === sanitized.id ? sanitized : p));
    const data = toSnake(sanitized);
    await supabase.from('properties').update(data).eq('id', data.id);
  };

  const addTenant = async (tenant: Tenant) => {
    setTenants(prev => [tenant, ...prev]);
    const data = toSnake(tenant);
    await supabase.from('tenants').insert(data);
  };

  const addContract = async (contract: Contract) => {
    const sanitized = sanitizeContract(contract);
    setContracts(prev => [sanitized, ...prev]);
    const data = toSnake(sanitized);
    await supabase.from('contracts').insert(data);
  };

  const updateContract = async (updatedContract: Contract) => {
    const sanitized = sanitizeContract(updatedContract);
    setContracts(prev => prev.map(c => c.id === sanitized.id ? sanitized : c));
    const data = toSnake(sanitized);
    await supabase.from('contracts').update(data).eq('id', data.id);
  };

  const addTransaction = async (tx: Transaction) => {
    const sanitized = sanitizeTransaction(tx);
    setTransactions(prev => [sanitized, ...prev]);
    const data = toSnake(sanitized);
    await supabase.from('transactions').insert(data);
  };

  const getDynamicTransactions = () => {
    const dynamicTxs: Transaction[] = [...transactions];
    const years = [2025, 2026];

    years.forEach(year => {
      // For each property, generate 12 months of community and IBI (divided by 12)
      properties.forEach(p => {
        if (p.communityFees && p.communityFees > 0) {
          for (let m = 1; m <= 12; m++) {
            dynamicTxs.push({
              id: `auto-comm-${p.id}-${year}-${m}`,
              propertyId: p.id,
              type: 'gasto',
              category: 'Comunidad',
              amount: p.communityFees,
              date: `${year}-${m.toString().padStart(2, '0')}-01`,
              description: 'Cuota Comunidad (Auto)'
            });
          }
        }
        if (p.ibi && p.ibi > 0) {
          const monthlyIbi = p.ibi / 12;
          for (let m = 1; m <= 12; m++) {
            dynamicTxs.push({
              id: `auto-ibi-${p.id}-${year}-${m}`,
              propertyId: p.id,
              type: 'gasto',
              category: 'Impuestos',
              amount: monthlyIbi,
              date: `${year}-${m.toString().padStart(2, '0')}-01`,
              description: 'Proporción IBI (Auto)'
            });
          }
        }
        if (p.hasMortgage && p.mortgageInstallment && p.mortgageInstallment > 0) {
          for (let m = 1; m <= 12; m++) {
            dynamicTxs.push({
              id: `auto-mort-${p.id}-${year}-${m}`,
              propertyId: p.id,
              type: 'gasto',
              category: 'Hipoteca',
              amount: p.mortgageInstallment,
              date: `${year}-${m.toString().padStart(2, '0')}-01`,
              description: 'Cuota Hipoteca (Auto)'
            });
          }
        }
      });

      // For each contract, only generate Rent if explicitly marked as 'Al día' in monthlyPayments and within contract validity dates
      contracts.forEach(c => {
        if (c.status === 'Activo') {
          const startMonth = c.startDate ? c.startDate.slice(0, 7) : '';
          const endMonth = c.endDate ? c.endDate.slice(0, 7) : '';

          for (let m = 1; m <= 12; m++) {
            const datePrefix = `${year}-${m.toString().padStart(2, '0')}`;
            
            // 1. Validar que el mes esté dentro de las fechas de vigencia del contrato
            const isWithinContract = (!startMonth || datePrefix >= startMonth) && (!endMonth || datePrefix <= endMonth);
            
            // 2. Validar que el mes esté EXPLÍCITAMENTE pagado ('Al día') en el control mensual
            const isPaid = c.monthlyPayments?.[datePrefix] === 'Al día';

            if (isWithinContract && isPaid) {
              const existingManualRent = transactions.find(t => t.propertyId === c.propertyId && t.category === 'Alquiler' && t.date.startsWith(datePrefix));
              if (!existingManualRent) {
                dynamicTxs.push({
                  id: `auto-rent-${c.id}-${year}-${m}`,
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
