import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import { AppProvider } from './store';
import App from './App';
import { TenantProvider } from './store-tenant';
import TenantApp from './components/TenantApp';
import { UserRole } from './types';
import { Building2, Loader2 } from 'lucide-react';

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
      <div className="h-screen min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden relative flex flex-col items-center justify-center font-sans bg-slate-900 text-white">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80" 
            alt="Loading Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/80 backdrop-blur-md"></div>
        </div>
        
        {/* Loading Content */}
        <div className="relative z-10 flex flex-col items-center animate-pulse">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-[#FACC15] rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-[#FACC15]/10">
              <Building2 className="w-8 h-8" />
            </div>
            <span className="text-3xl font-bold">Gesti<span className="text-[#FACC15]">Casa</span></span>
          </div>
          <Loader2 className="w-8 h-8 text-[#FACC15] animate-spin drop-shadow-lg" />
          <p className="mt-4 text-slate-300 font-medium tracking-wide">Cargando GestiCasa...</p>
        </div>
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
