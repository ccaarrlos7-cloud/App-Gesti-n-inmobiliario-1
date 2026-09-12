import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Home, Users, TrendingUp, Building2 } from 'lucide-react';

export default function Login() {
  const [language] = useState(() => localStorage.getItem('app_language') || 'Español');
  const isEs = language === 'Español';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.href,
          }
        });
        if (error) throw error;
        setSuccessMsg(isEs ? 'Registro exitoso. Ya puedes iniciar sesión.' : 'Registration successful. You can now log in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || (isEs ? 'Ha ocurrido un error' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen min-h-[100dvh] max-h-[100dvh] overflow-hidden relative flex w-full font-sans bg-slate-900">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <img 
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80" 
          alt="Real Estate Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30 dark:from-black/90 dark:via-black/70 dark:to-black/60 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 flex w-full h-full flex-col xl:flex-row overflow-hidden">
        {/* Left Column - Branding */}
        <div className="flex-1 flex flex-col justify-center xl:justify-between p-4 sm:p-6 lg:p-8 xl:p-16 text-white shrink-0 min-h-0">
          <div className="animate-fade-in-up">
            {/* Logo */}
            <div className="flex items-center gap-2 xl:gap-3 mb-2 xl:mb-6">
               <div className="w-10 h-10 xl:w-14 xl:h-14 bg-[#FACC15] rounded-xl xl:rounded-2xl flex items-center justify-center text-slate-900 shadow-lg">
                 <Building2 className="w-5 h-5 xl:w-8 xl:h-8" />
               </div>
               <span className="text-xl xl:text-3xl font-bold">Gesti<span className="text-[#FACC15]">Casa</span></span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold leading-tight mb-2 xl:mb-4 max-w-2xl drop-shadow-lg">
              {isEs ? 'Tu gestión inmobiliaria, más simple y eficiente' : 'Your real estate management, simpler and more efficient'}
            </h1>
          </div>
          
          {/* Bottom info features */}
          <div className="hidden lg:flex gap-6 xl:gap-12 text-sm font-medium text-slate-200 mt-4 xl:mt-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
             <div className="flex items-center gap-2 xl:gap-3">
               <Home className="w-5 h-5 xl:w-6 xl:h-6 text-[#FACC15]" />
               <div>
                 <p className="font-bold text-white text-sm xl:text-base">{isEs ? 'Gestiona' : 'Manage'}</p>
                 <p className="text-xs xl:text-sm text-slate-300">{isEs ? 'tus propiedades' : 'your properties'}</p>
               </div>
             </div>
             <div className="flex items-center gap-2 xl:gap-3">
               <Users className="w-5 h-5 xl:w-6 xl:h-6 text-[#FACC15]" />
               <div>
                 <p className="font-bold text-white text-sm xl:text-base">{isEs ? 'Controla' : 'Control'}</p>
                 <p className="text-xs xl:text-sm text-slate-300">{isEs ? 'tus inquilinos' : 'your tenants'}</p>
               </div>
             </div>
             <div className="flex items-center gap-2 xl:gap-3">
               <TrendingUp className="w-5 h-5 xl:w-6 xl:h-6 text-[#FACC15]" />
               <div>
                 <p className="font-bold text-white text-sm xl:text-base">{isEs ? 'Haz crecer' : 'Grow'}</p>
                 <p className="text-xs xl:text-sm text-slate-300">{isEs ? 'tu inversión' : 'your investment'}</p>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full xl:w-[550px] h-full flex items-center justify-center p-3 sm:p-4 lg:p-8 shrink-0 min-h-0">
           <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 lg:p-8 border border-white/20 dark:border-slate-800/50 flex flex-col justify-center shrink-0 min-h-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight shrink-0">
                {isEs ? 'Bienvenido a GestiCasa' : 'Welcome to GestiCasa'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-4 text-xs sm:text-sm leading-relaxed shrink-0">
                {isEs 
                  ? 'Accede a tu cuenta o regístrate para empezar a gestionar tus inmuebles.' 
                  : 'Access your account or register to start managing your properties.'}
              </p>

              {/* Segmented Control / Toggle Login/Register */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4 shrink-0">
                 <button 
                   type="button"
                   onClick={() => {setIsLogin(true); setError(null); setSuccessMsg(null);}}
                   className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ${isLogin ? 'bg-[#FACC15] text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                 >
                   {isEs ? 'Iniciar sesión' : 'Sign In'}
                 </button>
                 <button 
                   type="button"
                   onClick={() => {setIsLogin(false); setError(null); setSuccessMsg(null);}}
                   className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ${!isLogin ? 'bg-[#FACC15] text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                 >
                   {isEs ? 'Registrarse' : 'Sign Up'}
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 shrink-0 flex flex-col justify-center min-h-0">
                 {/* Email Input */}
                 <div className="relative group shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FACC15] transition-colors">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 sm:pl-11 pr-3 py-2 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15] outline-none transition-all duration-200"
                      placeholder={isEs ? 'Correo electrónico' : 'Email address'}
                    />
                 </div>
                 
                 {/* Password Input */}
                 <div className="relative group shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FACC15] transition-colors">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 sm:pl-11 pr-3 py-2 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FACC15]/30 focus:border-[#FACC15] outline-none transition-all duration-200"
                      placeholder={isEs ? 'Contraseña' : 'Password'}
                    />
                 </div>

                 {error && (
                   <div className="rounded-xl bg-red-50/80 dark:bg-red-900/20 p-2 sm:p-3 border border-red-100 dark:border-red-900/30 flex items-start shrink-0">
                     <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                   </div>
                 )}
                 
                 {successMsg && (
                   <div className="rounded-xl bg-green-50/80 dark:bg-green-900/20 p-2 sm:p-3 border border-green-100 dark:border-green-900/30 flex items-start shrink-0">
                     <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">{successMsg}</p>
                   </div>
                 )}

                 {/* Submit Button */}
                 <button
                   type="submit"
                   disabled={loading}
                   className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-4 mt-1 bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 text-sm sm:text-base font-bold rounded-xl shadow-lg shadow-[#FACC15]/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                 >
                   {loading ? (
                     <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                   ) : (
                     <>
                       <span>{isLogin ? (isEs ? 'Iniciar sesión' : 'Sign In') : (isEs ? 'Registrarse' : 'Sign Up')}</span>
                       <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                     </>
                   )}
                 </button>
              </form>

              {/* Security badge at bottom */}
              <div className="mt-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
                 <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-[#FACC15]" strokeWidth={1.5} />
                 <div className="text-[10px] sm:text-xs">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {isEs ? 'Tus datos están seguros' : 'Your data is secure'}
                    </p>
                    <p>
                      {isEs ? 'Utilizamos medidas de seguridad' : 'We use security measures'}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}


