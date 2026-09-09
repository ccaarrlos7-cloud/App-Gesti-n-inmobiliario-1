import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { Property, Tenant, Contract, Transaction, Issue, PendingInvitation } from './types';
import { supabase } from './lib/supabase';
import { uploadDocument, deleteDocument } from './lib/documentStorage';

interface AppContextType {
  properties: Property[];
  setProperties: (props: Property[]) => void;
  addProperty: (prop: Omit<Property, 'id'>) => Promise<Property | undefined>;
  updateProperty: (prop: Property) => Promise<void>;
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Omit<Tenant, 'id'>) => Promise<Tenant | undefined>;
  updateTenant: (tenant: Tenant) => Promise<void>;
  contracts: Contract[];
  setContracts: (contracts: Contract[]) => void;
  addContract: (contract: Omit<Contract, 'id'>) => Promise<Contract | undefined>;
  updateContract: (contract: Contract) => Promise<void>;
  uploadContractDocument: (contractId: string, file: File) => Promise<void>;
  toggleDocumentSharing: (documentId: string, shared: boolean) => Promise<void>;
  deleteContractDocument: (documentId: string, storagePath: string) => Promise<void>;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction | undefined>;
  getDynamicTransactions: () => Transaction[];
  issues: Issue[];
  setIssues: (issues: Issue[]) => void;
  addIssue: (issue: Omit<Issue, 'id'>) => Promise<Issue | undefined>;
  updateIssue: (issue: Issue) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  getIssueMessages: (issueId: string) => Promise<import('./types').IssueMessage[]>;
  addIssueMessage: (issueId: string, content: string) => Promise<boolean>;
  getTenantChatMessages: (tenantId: string) => Promise<import('./types').TenantChatMessage[]>;
  addTenantChatMessage: (tenantId: string, content: string) => Promise<boolean>;
  pendingInvitations: PendingInvitation[];
  loadPendingInvitations: () => Promise<void>;
  generateInvitation: (tenantId: string) => Promise<string | null>;
  revokeInvitation: (invitationId: string) => Promise<boolean>;
  userName: string;
  setUserName: (name: string) => void;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  unreadChatCounts: Record<string, number>;
  loadUnreadChatCounts: () => Promise<void>;
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
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
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
  const [unreadChatCounts, setUnreadChatCounts] = useState<Record<string, number>>({});

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
  
  const loadUnreadChatCounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_owner_unread_chat_counts');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((row: any) => {
        counts[row.tenant_id] = Number(row.unread_count);
      });
      setUnreadChatCounts(counts);
    } catch (e) {
      console.error("Error loading unread chat counts", e);
    }
  };

  const [isAppReady, setIsAppReady] = useState(false);
  const isLoadingData = useRef(false);
  const loadedSession = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData(session: any) {
      if (!session) return;
      if (loadedSession.current === session.user.id) {
        if (active) setIsAppReady(true);
        return;
      }
      if (isLoadingData.current) return;
      
      isLoadingData.current = true;
      try {
        const [propsRes, tenantsRes, contractsRes, txsRes, issuesRes, profileRes, ctRes, invRes] = await Promise.all([
          supabase.from('properties').select('*'),
          supabase.from('tenants').select('*'),
          supabase.from('contracts').select('*, contract_documents(*)'),
          supabase.from('transactions').select('*'),
          supabase.from('issues').select('*'),
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase.from('contract_tenants').select('*'),
          supabase.from('pending_tenant_invitations').select('id, tenant_id, status, expires_at, created_at, accepted_at')
        ]);

        if (!active) return;
        await loadUnreadChatCounts();

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
        if (invRes.data) setPendingInvitations(toCamel(invRes.data));
        
        loadedSession.current = session.user.id;
      } catch (e) {
        console.error("Error loading data from Supabase", e);
      } finally {
        isLoadingData.current = false;
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
        loadedSession.current = null;
        setProperties([]);
        setTenants([]);
        setContracts([]);
        setTransactions([]);
        setIssues([]);
        setPendingInvitations([]);
        setUserName("Usuario");
        setAvatarUrl("");
        setUnreadChatCounts({});
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
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, name, avatar_url: avatarUrl }, { onConflict: 'id' });
      if (error) console.error("Error saving profile name:", error);
    }
  };

  const updateAvatarUrl = async (url: string) => {
    setAvatarUrl(url);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, name: userName, avatar_url: url }, { onConflict: 'id' });
      if (error) console.error("Error saving profile avatar:", error);
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

  const updateTenant = async (updatedTenant: Tenant): Promise<void> => {
    const data = toSnake(updatedTenant);
    const { error } = await supabase.from('tenants').update(data).eq('id', data.id);
    if (error) {
      console.error("Error al actualizar inquilino:", error);
      return;
    }
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
  };

  const addContract = async (contract: Omit<Contract, 'id'>): Promise<Contract | undefined> => {
    const sanitized = sanitizeContract(contract as Contract);
    const { tenantIds, contractDocuments, ...contractData } = sanitized;
    const data = toSnake(contractData);
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
    
    // Optimistic UI update: update local state immediately so Dashboard reflects changes instantly
    setContracts(prev => prev.map(c => c.id === sanitized.id ? sanitized : c));

    const { tenantIds, contractDocuments, ...contractData } = sanitized;
    const data = toSnake(contractData);
    
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
  };

  const uploadContractDocument = async (contractId: string, file: File): Promise<void> => {
    try {
      const fullUrl = await uploadDocument(file);
      const storagePath = fullUrl.replace('storage://', '');

      const data = {
        contract_id: contractId,
        name: file.name,
        storage_path: storagePath,
        size: file.size,
        shared_with_tenants: false
      };

      const { data: insertedData, error } = await supabase.from('contract_documents').insert(data).select().single();
      if (error) {
        console.error("Error al subir documento de contrato:", error);
        return;
      }

      setContracts(prev => prev.map(c => {
        if (c.id === contractId) {
          return {
            ...c,
            contractDocuments: [toCamel(insertedData), ...(c.contractDocuments || [])]
          };
        }
        return c;
      }));
    } catch (e) {
      console.error("Error uploadContractDocument:", e);
    }
  };

  const toggleDocumentSharing = async (documentId: string, shared: boolean): Promise<void> => {
    const { error } = await supabase.from('contract_documents').update({ shared_with_tenants: shared }).eq('id', documentId);
    if (error) {
      console.error("Error al cambiar estado compartido del documento:", error);
      return;
    }

    setContracts(prev => prev.map(c => {
      if (c.contractDocuments?.some(d => d.id === documentId)) {
        return {
          ...c,
          contractDocuments: c.contractDocuments.map(d => d.id === documentId ? { ...d, sharedWithTenants: shared } : d)
        };
      }
      return c;
    }));
  };

  const deleteContractDocument = async (documentId: string, storagePath: string): Promise<void> => {
    await deleteDocument('storage://' + storagePath);
    
    const { error } = await supabase.from('contract_documents').delete().eq('id', documentId);
    if (error) {
      console.error("Error al borrar registro del documento:", error);
      return;
    }

    setContracts(prev => prev.map(c => {
      if (c.contractDocuments?.some(d => d.id === documentId)) {
        return {
          ...c,
          contractDocuments: c.contractDocuments.filter(d => d.id !== documentId)
        };
      }
      return c;
    }));
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
    const years = [2025, 2026];
    
    // Filtramos las transacciones manuales de 'Alquiler' en los años calculados
    // para que la ÚNICA fuente de ingresos por alquiler sea el CRM.
    // Esto evita duplicados y lógica paralela.
    const dynamicTxs: Transaction[] = transactions.filter(t => {
      if (t.category === 'Alquiler' && years.some(y => t.date.startsWith(y.toString()))) {
        return false;
      }
      return true;
    });

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    years.forEach(year => {
      // Determinar hasta qué mes computar los gastos automáticos para el año actual
      // (No anticipar gastos futuros)
      let maxExpenseMonth = 12;
      if (year === currentYear) {
        maxExpenseMonth = currentMonth;
      } else if (year > currentYear) {
        maxExpenseMonth = 0;
      }

      // For each property, generate up to maxExpenseMonth of community and IBI
      properties.forEach(p => {
        if (p.communityFees && p.communityFees > 0) {
          for (let m = 1; m <= maxExpenseMonth; m++) {
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
          for (let m = 1; m <= maxExpenseMonth; m++) {
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
          for (let m = 1; m <= maxExpenseMonth; m++) {
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

      // Generar ingresos de Alquiler exclusivamente basados en el control de pagos del CRM
      contracts.forEach(c => {
        const startMonth = c.startDate ? c.startDate.slice(0, 7) : '';
        const endMonth = c.endDate ? c.endDate.slice(0, 7) : '';

        for (let m = 1; m <= 12; m++) {
          const datePrefix = `${year}-${m.toString().padStart(2, '0')}`;
          
          // 1. Validar que el mes esté dentro de las fechas de vigencia del contrato
          const isWithinContract = (!startMonth || datePrefix >= startMonth) && (!endMonth || datePrefix <= endMonth);
          
          // 2. Validar que el mes esté EXPLÍCITAMENTE pagado ('Al día') en el control mensual
          const isPaid = c.monthlyPayments?.[datePrefix] === 'Al día';

          if (isWithinContract && isPaid) {
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

  const getIssueMessages = async (issueId: string) => {
    const { data, error } = await supabase
      .from('issue_messages')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching issue messages:", error);
      return [];
    }
    return toCamel(data);
  };

  const addIssueMessage = async (issueId: string, content: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { error } = await supabase.from('issue_messages').insert({
      issue_id: issueId,
      author_id: userData.user.id,
      author_role: 'propietario',
      content: content
    });

    if (error) {
      console.error("Error adding issue message:", error);
      return false;
    }
    return true;
  };

  const getTenantChatMessages = async (tenantId: string) => {
    const { data, error } = await supabase
      .from('tenant_messages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching tenant messages:", error);
      return [];
    }
    return toCamel(data);
  };

  const addTenantChatMessage = async (tenantId: string, content: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { error } = await supabase.from('tenant_messages').insert({
      tenant_id: tenantId,
      author_id: userData.user.id,
      author_role: 'propietario',
      content: content
    });

    if (error) {
      console.error("Error adding tenant message:", error);
      return false;
    }
    return true;
  };

  const loadPendingInvitations = async () => {
    const { data, error } = await supabase.from('pending_tenant_invitations').select('id, tenant_id, status, expires_at, created_at, accepted_at');
    if (!error && data) {
      setPendingInvitations(toCamel(data));
    }
  };

  const generateInvitation = async (tenantId: string): Promise<string | null> => {
    try {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      const tokenPlain = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      
      const encoder = new TextEncoder();
      const data = encoder.encode(tokenPlain);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const tokenHash = Array.from(new Uint8Array(hashBuffer), byte => byte.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.rpc('create_tenant_invitation', {
        p_tenant_id: tenantId,
        p_token_hash: tokenHash
      });

      if (error) {
        console.error("Error creating invitation:", error);
        return null;
      }

      await loadPendingInvitations();
      return tokenPlain;
    } catch (e) {
      console.error("Error in generateInvitation:", e);
      return null;
    }
  };

  const revokeInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('revoke_tenant_invitation', {
        p_invitation_id: invitationId
      });
      if (error) {
        console.error("Error revoking invitation:", error);
        return false;
      }
      await loadPendingInvitations();
      return true;
    } catch (e) {
      console.error("Error in revokeInvitation:", e);
      return false;
    }
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
      tenants, setTenants, addTenant, updateTenant,
      contracts, setContracts, addContract, updateContract, uploadContractDocument, toggleDocumentSharing, deleteContractDocument,
      transactions, setTransactions, addTransaction, getDynamicTransactions,
      issues, setIssues, addIssue, updateIssue, deleteIssue, getIssueMessages, addIssueMessage,
      getTenantChatMessages, addTenantChatMessage,
      pendingInvitations, loadPendingInvitations, generateInvitation, revokeInvitation,
      userName, setUserName: updateUserName,
      avatarUrl, setAvatarUrl: updateAvatarUrl,
      theme, setTheme,
      language, setLanguage,
      unreadChatCounts, loadUnreadChatCounts
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
