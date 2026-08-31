import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Property, Tenant, Contract, Transaction, Issue } from './types';
import { supabase } from './lib/supabase';

interface AppContextType {
  properties: Property[];
  setProperties: (props: Property[]) => void;
  addProperty: (prop: Omit<Property, 'id'>) => Promise<Property | undefined>;
  updateProperty: (prop: Property) => Promise<void>;
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Omit<Tenant, 'id'>) => Promise<Tenant | undefined>;
  contracts: Contract[];
  setContracts: (contracts: Contract[]) => void;
  addContract: (contract: Omit<Contract, 'id'>) => Promise<Contract | undefined>;
  updateContract: (contract: Contract) => Promise<void>;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction | undefined>;
  getDynamicTransactions: () => Transaction[];
  issues: Issue[];
  setIssues: (issues: Issue[]) => void;
  addIssue: (issue: Omit<Issue, 'id'>) => Promise<Issue | undefined>;
  updateIssue: (issue: Issue) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
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
    let active = true;

    async function loadData(session: any) {
      if (!session) return;
      try {
        const [propsRes, tenantsRes, contractsRes, txsRes, issuesRes, profileRes, ctRes] = await Promise.all([
          supabase.from('properties').select('*'),
          supabase.from('tenants').select('*'),
          supabase.from('contracts').select('*'),
          supabase.from('transactions').select('*'),
          supabase.from('issues').select('*'),
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase.from('contract_tenants').select('*')
        ]);

        if (!active) return;

        if (profileRes.data) {
          setUserName(profileRes.data.name || "Usuario");
          setAvatarUrl(profileRes.data.avatar_url || "");
        }
        if (propsRes.data) setProperties(toCamel(propsRes.data));
        if (tenantsRes.data) setTenants(toCamel(tenantsRes.data));
        
        if (contractsRes.data) {
          const contractsData = toCamel(contractsRes.data);
          if (ctRes.data) {
            const ctData = toCamel(ctRes.data);
            contractsData.forEach((c: any) => {
              c.tenantIds = ctData.filter((ct: any) => ct.contractId === c.id).map((ct: any) => ct.tenantId);
            });
          } else {
            contractsData.forEach((c: any) => { c.tenantIds = []; });
          }
          setContracts(contractsData);
        }
        
        if (txsRes.data) setTransactions(toCamel(txsRes.data));
        if (issuesRes.data) setIssues(toCamel(issuesRes.data));
        
      } catch (e) {
        console.error("Error loading data from Supabase", e);
      } finally {
        if (active) setIsAppReady(true);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadData(session);
      } else {
        setIsAppReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadData(session);
      } else {
        setProperties([]);
        setTenants([]);
        setContracts([]);
        setTransactions([]);
        setIssues([]);
        setUserName("Usuario");
        setAvatarUrl("");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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

  const addProperty = async (property: Omit<Property, 'id'>): Promise<Property | undefined> => {
    const sanitized = sanitizeProperty(property as Property); // As if it was full to sanitize numbers
    const data = toSnake(sanitized);
    delete data.id; // Ensure no frontend ID is sent
    
    const { data: insertedData, error } = await supabase.from('properties').insert(data).select().single();
    if (error) {
      console.error("Error al añadir propiedad:", error);
      return;
    }
    
    const newProperty = toCamel(insertedData);
    setProperties(prev => [newProperty, ...prev]);
    return newProperty;
  };

  const updateProperty = async (updatedProp: Property): Promise<void> => {
    const sanitized = sanitizeProperty(updatedProp);
    const data = toSnake(sanitized);
    
    const { error } = await supabase.from('properties').update(data).eq('id', data.id);
    if (error) {
      console.error("Error al actualizar propiedad:", error);
      return;
    }
    
    setProperties(prev => prev.map(p => p.id === sanitized.id ? sanitized : p));
  };

  const updateUserName = async (name: string) => {
    setUserName(name);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from('profiles').update({ name }).eq('id', session.user.id);
    }
  };

  const updateAvatarUrl = async (url: string) => {
    setAvatarUrl(url);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id);
    }
  };

  const addTenant = async (tenant: Omit<Tenant, 'id'>): Promise<Tenant | undefined> => {
    const data = toSnake(tenant);
    delete data.id;
    const { data: insertedData, error } = await supabase.from('tenants').insert(data).select().single();
    if (error) {
      console.error("Error al añadir inquilino:", error);
      return;
    }
    const newTenant = toCamel(insertedData);
    setTenants(prev => [newTenant, ...prev]);
    return newTenant;
  };

  const addContract = async (contract: Omit<Contract, 'id'>): Promise<Contract | undefined> => {
    const sanitized = sanitizeContract(contract as Contract);
    const { tenantIds, ...contractWithoutTenants } = sanitized;
    const data = toSnake(contractWithoutTenants);
    delete data.id;
    
    const { data: insertedData, error } = await supabase.from('contracts').insert(data).select().single();
    if (error) {
      console.error("Error al añadir contrato:", error);
      return;
    }

    if (tenantIds && tenantIds.length > 0) {
      const ctData = tenantIds.map(tid => ({
        contract_id: insertedData.id,
        tenant_id: tid
      }));
      const { error: ctError } = await supabase.from('contract_tenants').insert(ctData);
      if (ctError) {
        console.error("Error al asociar inquilinos al contrato, ejecutando ROLLBACK:", ctError);
        await supabase.from('contracts').delete().eq('id', insertedData.id);
        return; 
      }
    }
    
    const newContract = { ...toCamel(insertedData), tenantIds: tenantIds || [] };
    setContracts(prev => [newContract, ...prev]);
    return newContract;
  };

  const updateContract = async (updatedContract: Contract): Promise<void> => {
    const sanitized = sanitizeContract(updatedContract);
    const { tenantIds, ...contractWithoutTenants } = sanitized;
    const data = toSnake(contractWithoutTenants);
    
    const { error } = await supabase.from('contracts').update(data).eq('id', data.id);
    if (error) {
      console.error("Error al actualizar contrato:", error);
      return;
    }

    // Replace old associations with new ones safely
    const { data: oldCtData } = await supabase.from('contract_tenants').select('*').eq('contract_id', data.id);
    await supabase.from('contract_tenants').delete().eq('contract_id', data.id);
    
    if (tenantIds && tenantIds.length > 0) {
      const ctData = tenantIds.map(tid => ({
        contract_id: sanitized.id,
        tenant_id: tid
      }));
      const { error: ctError } = await supabase.from('contract_tenants').insert(ctData);
      if (ctError) {
        console.error("Error al actualizar inquilinos del contrato, restaurando antiguos:", ctError);
        if (oldCtData && oldCtData.length > 0) {
           await supabase.from('contract_tenants').insert(oldCtData);
        }
        return;
      }
    }

    setContracts(prev => prev.map(c => c.id === sanitized.id ? sanitized : c));
  };

  const addTransaction = async (tx: Omit<Transaction, 'id'>): Promise<Transaction | undefined> => {
    const sanitized = sanitizeTransaction(tx as Transaction);
    const data = toSnake(sanitized);
    delete data.id;
    const { data: insertedData, error } = await supabase.from('transactions').insert(data).select().single();
    if (error) {
      console.error("Error al añadir transacción:", error);
      return;
    }
    const newTx = toCamel(insertedData);
    setTransactions(prev => [newTx, ...prev]);
    return newTx;
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

  const addIssue = async (issue: Omit<Issue, 'id'>): Promise<Issue | undefined> => {
    const data = toSnake(issue);
    delete data.id;
    const { data: insertedData, error } = await supabase.from('issues').insert(data).select().single();
    if (error) {
      console.error("Error al añadir incidencia:", error);
      return;
    }
    const newIssue = toCamel(insertedData);
    setIssues(prev => [newIssue, ...prev]);
    return newIssue;
  };

  const updateIssue = async (updatedIssue: Issue): Promise<void> => {
    const data = toSnake(updatedIssue);
    const { error } = await supabase.from('issues').update(data).eq('id', data.id);
    if (error) {
      console.error("Error al actualizar incidencia:", error);
      return;
    }
    setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
  };

  const deleteIssue = async (id: string): Promise<void> => {
    const { error } = await supabase.from('issues').delete().eq('id', id);
    if (error) {
      console.error("Error al eliminar incidencia:", error);
      return;
    }
    setIssues(prev => prev.filter(i => i.id !== id));
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
      properties, setProperties, addProperty, updateProperty, 
      tenants, setTenants, addTenant,
      contracts, setContracts, addContract, updateContract,
      transactions, setTransactions, addTransaction, getDynamicTransactions,
      issues, setIssues, addIssue, updateIssue, deleteIssue,
      userName, setUserName: updateUserName,
      avatarUrl, setAvatarUrl: updateAvatarUrl,
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
