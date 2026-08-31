import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Mail, Lock, Loader2 } from 'lucide-react';
import { useAppContext } from '../store';

export default function Login() {
  const { language } = useAppContext();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          {isLogin ? (isEs ? 'Iniciar Sesión' : 'Sign In') : (isEs ? 'Crear Cuenta' : 'Create Account')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          {isEs ? 'O ' : 'Or '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMsg(null);
            }}
            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
          >
            {isLogin 
              ? (isEs ? 'regístrate aquí' : 'sign up here') 
              : (isEs ? 'inicia sesión aquí' : 'sign in here')}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200 dark:border-slate-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 dark:border-slate-600 rounded-md py-2 border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{isEs ? 'Contraseña' : 'Password'}</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 dark:border-slate-600 rounded-md py-2 border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            
            {successMsg && (
              <div className="rounded-md bg-green-50 dark:bg-green-950/40 p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">{successMsg}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? (isEs ? 'Entrar' : 'Sign In') : (isEs ? 'Registrarse' : 'Sign Up'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

