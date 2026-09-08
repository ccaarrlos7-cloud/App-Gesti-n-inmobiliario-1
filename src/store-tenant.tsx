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
  getTenantIssueMessages: (issueId: string) => Promise<import('./types').IssueMessage[]>;
  addTenantIssueMessage: (issueId: string, content: string) => Promise<{success: boolean, error?: string}>;
  getTenantChatMessages: () => Promise<import('./types').TenantChatMessage[]>;
  addTenantChatMessage: (content: string) => Promise<{success: boolean, error?: string}>;
  unreadChatCount: number;
  loadUnreadChatCount: () => Promise<void>;
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
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const loadUnreadChatCount = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase.rpc('get_tenant_unread_chat_count', {
        p_tenant_id: profile.id
      });
      if (!error && data !== null) {
        setUnreadChatCount(Number(data));
      }
    } catch (e) {
      console.error("Error loading tenant unread chat count", e);
    }
  };

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

  const getTenantIssueMessages = async (issueId: string) => {
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

  const addTenantIssueMessage = async (issueId: string, content: string) => {
    try {
      const { error } = await supabase.rpc('add_tenant_issue_message', {
        p_issue_id: issueId,
        p_content: content
      });
      
      if (error) {
        console.error("Error adding message:", error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error("Unexpected error:", err);
      return { success: false, error: err.message || "Error desconocido" };
    }
  };

  const getTenantChatMessages = async () => {
    if (!profile) return [];
    
    // The tenant ID is in profile.id (from the tenants table view we fetch)
    const { data, error } = await supabase
      .from('tenant_messages')
      .select('*')
      .eq('tenant_id', profile.id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching chat messages:", error);
      return [];
    }
    return toCamel(data);
  };

  const addTenantChatMessage = async (content: string) => {
    if (!profile) return { success: false, error: "No profile loaded" };
    
    try {
      const { error } = await supabase.rpc('add_tenant_chat_message', {
        p_tenant_id: profile.id,
        p_content: content
      });
      
      if (error) {
        console.error("Error adding chat message:", error);
        return { success: false, error: error.message };
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
        const profileResSingle = await supabase.from('tenant_self_view').select('*').single();
        const loadedProfile = profileResSingle.data ? toCamel(profileResSingle.data) : null;
        
        if (loadedProfile) {
          const { data, error } = await supabase.rpc('get_tenant_unread_chat_count', {
            p_tenant_id: loadedProfile.id
          });
          if (!error && data !== null) {
            setUnreadChatCount(Number(data));
          }
        }
        const [profileRes, contractsRes, issuesRes, documentsRes] = await Promise.all([
          supabase.from('tenant_self_view').select('*').single(),
          supabase.from('tenant_contract_view').select('*'),
          supabase.from('tenant_issue_view').select('*'),
          supabase.from('tenant_document_view').select('*')
        ]);

        if (!active) return;

        if (profileRes.data) {
          setProfile(toCamel(profileRes.data));
        }
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
      profile, contracts, issues, documents, theme, setTheme, language, setLanguage, addTenantIssue,
      getTenantIssueMessages,
      addTenantIssueMessage,
      getTenantChatMessages,
      addTenantChatMessage,
      unreadChatCount,
      loadUnreadChatCount
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
