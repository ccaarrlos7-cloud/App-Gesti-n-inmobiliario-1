import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { TenantSelfView, TenantContractView, TenantIssueView, TenantDocumentView } from './types';
import { supabase } from './lib/supabase';

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

interface TenantContextType {
  profile: TenantSelfView | null;
  contracts: TenantContractView[];
  issues: TenantIssueView[];
  documents: TenantDocumentView[];
  theme: string;
  setTheme: (theme: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  addTenantIssue: (contractId: string, title: string, description: string) => Promise<{success: boolean, error?: string}>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<TenantSelfView | null>(null);
  const [contracts, setContracts] = useState<TenantContractView[]>([]);
  const [issues, setIssues] = useState<TenantIssueView[]>([]);
  const [documents, setDocuments] = useState<TenantDocumentView[]>([]);
  
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
  const isLoadingData = useRef(false);
  const loadedSession = useRef<string | null>(null);

  const addTenantIssue = async (contractId: string, title: string, description: string) => {
    try {
      const { data, error } = await supabase.rpc('create_tenant_issue', {
        p_contract_id: contractId,
        p_title: title,
        p_description: description
      });
      if (error) {
        console.error("Error creating issue:", error);
        return { success: false, error: error.message };
      }
      
      // Refresh issues
      const issuesRes = await supabase.from('tenant_issue_view').select('*');
      if (issuesRes.data) {
        setIssues(toCamel(issuesRes.data));
      }
      return { success: true };
    } catch (err: any) {
      console.error("Unexpected error:", err);
      return { success: false, error: err.message || "Error desconocido" };
    }
  };

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
        const [profileRes, contractsRes, issuesRes, documentsRes] = await Promise.all([
          supabase.from('tenant_self_view').select('*').single(),
          supabase.from('tenant_contract_view').select('*'),
          supabase.from('tenant_issue_view').select('*'),
          supabase.from('tenant_document_view').select('*')
        ]);

        if (!active) return;

        if (profileRes.data) setProfile(toCamel(profileRes.data));
        if (contractsRes.data) setContracts(toCamel(contractsRes.data));
        if (issuesRes.data) setIssues(toCamel(issuesRes.data));
        if (documentsRes.data) setDocuments(toCamel(documentsRes.data));
        
        loadedSession.current = session.user.id;
      } catch (e) {
        console.error("Error loading tenant data from Supabase", e);
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
        setProfile(null);
        setContracts([]);
        setIssues([]);
        setDocuments([]);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isAppReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold animate-pulse">Conectando a tu portal...</p>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ 
      profile, contracts, issues, documents, theme, setTheme, language, setLanguage, addTenantIssue
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
}
