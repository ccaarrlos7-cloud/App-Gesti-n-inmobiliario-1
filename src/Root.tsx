import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import { AppProvider } from './store';
import App from './App';
import { TenantProvider } from './store-tenant';
import TenantApp from './components/TenantApp';
import { UserRole } from './types';

export default function Root() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
          return;
        }

        // 1. Auth Gate: Check for invitation token in URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
          if (mounted) setLinking(true);
          // Remove token from URL immediately to prevent keeping it in history
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('token');
          window.history.replaceState({}, document.title, newUrl.toString());
          
          const { error: rpcError } = await supabase.rpc('accept_tenant_invitation', { token_plain: token });
          
          if (rpcError) {
            console.error("Error aceptando invitación:", rpcError);
            if (mounted) {
              setError("No se pudo aceptar la invitación: " + rpcError.message);
              setLoading(false);
              setLinking(false);
            }
            return; // We stop execution here to prevent loading the app with wrong permissions
          }
        }

        // 2. Load the definitive role from profiles after any possible token consumption
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile role:", profileError);
        }

        if (mounted) {
          setSession(session);
          if (profileData && profileData.role) {
            setRole(profileData.role as UserRole);
          } else {
            setRole(null);
          }
          setLinking(false);
          setLoading(false);
        }

      } catch (err) {
        console.error("Initialize error", err);
        if (mounted) {
          setError("Error crítico de inicialización de sesión");
          setLoading(false);
        }
      }
    }

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        if (mounted) {
          setSession(null);
          setRole(null);
        }
      } else if (newSession.user.id !== session?.user?.id) {
        // Re-initialize only if user changes (avoids infinite loops on token refresh)
        setLoading(true);
        initialize();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading || linking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold animate-pulse">{linking ? 'Vinculando tu cuenta...' : 'Verificando sesión...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4 font-sans">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl max-w-md w-full border border-red-200 shadow-sm">
          <h2 className="font-bold mb-3 text-lg">Error de Acceso</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 w-full transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Si no hay sesión, mostramos Login. Cuando el usuario se loguee, onAuthStateChange disparará initialize()
  if (!session) {
    return <Login />;
  }

  // 3. Bifurcación Estricta: Solo montamos el Provider que corresponda al role confirmado
  if (role === 'inquilino') {
    return (
      <TenantProvider>
        <TenantApp />
      </TenantProvider>
    );
  }

  if (role === 'propietario') {
    return (
      <AppProvider>
        <App />
      </AppProvider>
    );
  }

  // Any other role or null
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4 font-sans">
      <div className="bg-red-50 text-red-600 p-6 rounded-xl max-w-md w-full border border-red-200 shadow-sm">
        <h2 className="font-bold mb-3 text-lg">Error de Configuración</h2>
        <p className="mb-6">El rol de su cuenta no es válido o no está configurado. Por favor contacte con soporte.</p>
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 w-full transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
