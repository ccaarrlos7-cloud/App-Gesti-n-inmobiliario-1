import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import { AppProvider } from './store';
import App from './App';
import { TenantProvider } from './store-tenant';
import TenantApp from './components/TenantApp';
import { UserRole } from './types';
import { Building2, Loader2, Lock, Eye, EyeOff, Check } from 'lucide-react';

// ─── Reset-password screen shown when Supabase sends PASSWORD_RECOVERY ────────
function ResetPasswordScreen() {
  const language = localStorage.getItem('app_language') || 'Español';
  const isEs = language === 'Español';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(isEs ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError(isEs ? 'La contraseña debe tener al menos 6 caracteres.' : 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      setError(err.message || (isEs ? 'Ha ocurrido un error.' : 'An error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = async () => {
    // Clear the recovery hash from the URL
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = '';
    }
    // Reload to enter the app normally (session is already active)
    window.location.reload();
  };

  return (
    <div className="h-screen min-h-[100dvh] w-full overflow-hidden relative flex items-center justify-center font-sans bg-slate-900">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/80 backdrop-blur-md"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 dark:border-slate-800/50">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center shadow-lg rounded-xl overflow-hidden shrink-0">
              <img src="/logo-gesticasa.png" alt="GestiCasa Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">Gesti<span className="text-[#FACC15]">Casa</span></span>
          </div>

          {done ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <Check size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {isEs ? 'Contraseña actualizada' : 'Password updated'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                {isEs ? 'Tu contraseña ha sido cambiada correctamente. Ya puedes acceder a la aplicación.' : 'Your password has been changed successfully. You can now enter the app.'}
              </p>
              <button
                onClick={handleGoToLogin}
                className="w-full py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-bold rounded-xl transition-colors"
              >
                {isEs ? 'Entrar a la aplicación' : 'Enter application'}
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {isEs ? 'Nueva contraseña' : 'New password'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
                {isEs ? 'Introduce y confirma tu nueva contraseña.' : 'Enter and confirm your new password.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FACC15] transition-colors">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 sm:pl-11 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15] outline-none transition-all"
                    placeholder={isEs ? 'Nueva contraseña' : 'New password'}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Confirm password */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FACC15] transition-colors">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 sm:pl-11 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15] outline-none transition-all"
                    placeholder={isEs ? 'Confirmar contraseña' : 'Confirm password'}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50/80 dark:bg-red-900/20 p-3 border border-red-100 dark:border-red-900/30">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-bold rounded-xl shadow-lg shadow-[#FACC15]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <Loader2 className="animate-spin h-5 w-5" />
                    : (isEs ? 'Guardar contraseña' : 'Save password')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Root() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (window.location.hash.includes('type=recovery')) {
          if (mounted) {
            setIsPasswordRecovery(true);
            setLoading(false);
          }
          return;
        }

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
            return;
          }
        }

        // 2. Load role from profiles
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Intercept password recovery before anything else
      if (event === 'PASSWORD_RECOVERY') {
        if (mounted) {
          setIsPasswordRecovery(true);
          setLoading(false);
        }
        return;
      }

      if (!newSession) {
        if (mounted) {
          setSession(null);
          setRole(null);
          setIsPasswordRecovery(false);
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

  // PASSWORD RECOVERY mode — show reset form
  if (isPasswordRecovery) {
    return <ResetPasswordScreen />;
  }

  if (loading || linking) {
    return (
      <div className="h-screen min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden relative flex flex-col items-center justify-center font-sans bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 h-full w-full">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
            alt="Loading Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/80 backdrop-blur-md"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center animate-pulse">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 flex items-center justify-center shadow-xl shadow-black/10 rounded-2xl overflow-hidden">
              <img src="/logo-gesticasa.png" alt="GestiCasa Logo" className="w-full h-full object-cover" />
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

  if (!session) {
    return <Login />;
  }

  // 3. Bifurcación Estricta
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
